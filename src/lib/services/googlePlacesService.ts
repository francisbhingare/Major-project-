import { Hospital } from '@/types/emergency';
import { calculateHaversineDistance, isValidCoordinate } from '../utils/haversine';

export interface GooglePlacesSearchResult {
  success: boolean;
  hospitals: Hospital[];
  search_radius_km: number;
  configured: boolean;
  error?: string;
  total_found?: number;
  api_endpoint?: 'PLACES_NEW' | 'PLACES_LEGACY';
}

export function getGooglePlacesApiKey(): string | null {
  const key =
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.GOOGLE_MAPS_SERVER_API_KEY ||
    process.env.GOOGLE_MAPS_BROWSER_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY;

  if (!key || key.startsWith('your_') || key.trim() === '') {
    return null;
  }
  return key.trim();
}

export function isGooglePlacesConfigured(): boolean {
  return Boolean(getGooglePlacesApiKey());
}

export async function searchNearbyHospitalsGoogle(
  latitude: number,
  longitude: number,
  radiusKm: number = 5
): Promise<GooglePlacesSearchResult> {
  if (!isValidCoordinate(latitude, longitude)) {
    return {
      success: false,
      hospitals: [],
      search_radius_km: radiusKm,
      configured: isGooglePlacesConfigured(),
      error: `Invalid search coordinates provided: lat=${latitude}, lon=${longitude}. Latitude must be between -90 and 90, longitude between -180 and 180.`,
    };
  }

  const apiKey = getGooglePlacesApiKey();

  if (!apiKey) {
    return {
      success: false,
      hospitals: [],
      search_radius_km: radiusKm,
      configured: false,
      error: 'GOOGLE PLACES API NOT CONFIGURED. Please set GOOGLE_PLACES_API_KEY in your environment variables to enable live Google Maps facility discovery.',
    };
  }

  const radiusMeters = Math.min(Math.round(radiusKm * 1000), 50000);

  // Attempt 1: Official Google Places API (New) Nearby Search
  try {
    const url = 'https://places.googleapis.com/v1/places:searchNearby';
    const fieldMask = [
      'places.id',
      'places.displayName',
      'places.formattedAddress',
      'places.location',
      'places.primaryType',
      'places.types',
      'places.googleMapsUri',
      'places.businessStatus',
      'places.nationalPhoneNumber',
      'places.websiteUri',
    ].join(',');

    const requestBody = {
      includedTypes: ['hospital'],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: {
            latitude,
            longitude,
          },
          radius: radiusMeters,
        },
      },
      rankPreference: 'DISTANCE',
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify(requestBody),
    });

    if (response.ok) {
      const data = await response.json();
      const rawPlaces = data.places || [];

      // Filter and map only places with genuine source coordinates
      const hospitals: Hospital[] = rawPlaces
        .map((place: any): Hospital | null => {
          const hospLat = place.location?.latitude;
          const hospLon = place.location?.longitude;

          // Never silently substitute search coordinates if place coords are missing
          if (!isValidCoordinate(hospLat, hospLon)) {
            return null;
          }

          const distanceKm = calculateHaversineDistance(latitude, longitude, hospLat, hospLon);

          return {
            id: `gplace-${place.id}`,
            google_place_id: place.id,
            name: place.displayName?.text || 'Hospital Facility',
            address: place.formattedAddress || 'Address verified on Google Maps',
            latitude: hospLat,
            longitude: hospLon,
            phone: place.nationalPhoneNumber || undefined,
            website: place.websiteUri || undefined,
            google_maps_uri: place.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${hospLat},${hospLon}`,
            business_status: place.businessStatus || 'OPERATIONAL',
            source: 'GOOGLE_PLACES',
            source_retrieved_at: new Date().toISOString(),
            verification_status: 'NOT_AVAILABLE',
            capabilities: undefined, // Never invent unverified capabilities
            is_demo: false,
            distanceKm,
          };
        })
        .filter((h): h is Hospital => h !== null);

      hospitals.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

      return {
        success: true,
        hospitals,
        search_radius_km: radiusKm,
        configured: true,
        total_found: hospitals.length,
        api_endpoint: 'PLACES_NEW',
      };
    }

    const newApiError = await response.text();
    console.warn(`[Google Places] Places API (New) returned ${response.status}: ${newApiError}. Falling back to Legacy API.`);
  } catch (newApiErr: any) {
    console.warn(`[Google Places] Places API (New) network attempt failed: ${newApiErr.message}. Trying Legacy API.`);
  }

  // Attempt 2: Google Maps Places API (Legacy Nearby Search fallback)
  try {
    const legacyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radiusMeters}&type=hospital&key=${apiKey}`;
    const legacyRes = await fetch(legacyUrl);

    if (!legacyRes.ok) {
      const legacyError = await legacyRes.text();
      return {
        success: false,
        hospitals: [],
        search_radius_km: radiusKm,
        configured: true,
        error: `Google Places API request failed (${legacyRes.status}): ${legacyError}`,
      };
    }

    const legacyData = await legacyRes.json();
    if (legacyData.status !== 'OK' && legacyData.status !== 'ZERO_RESULTS') {
      return {
        success: false,
        hospitals: [],
        search_radius_km: radiusKm,
        configured: true,
        error: `Google Places API returned status "${legacyData.status}": ${legacyData.error_message || 'Search rejected.'}`,
      };
    }

    const results = legacyData.results || [];
    const hospitals: Hospital[] = results
      .map((place: any): Hospital | null => {
        const hospLat = place.geometry?.location?.lat;
        const hospLon = place.geometry?.location?.lng;

        // Never substitute search coordinates
        if (!isValidCoordinate(hospLat, hospLon)) {
          return null;
        }

        const distanceKm = calculateHaversineDistance(latitude, longitude, hospLat, hospLon);

        return {
          id: `gplace-${place.place_id || place.id}`,
          google_place_id: place.place_id,
          name: place.name || 'Hospital Facility',
          address: place.vicinity || place.formatted_address || 'Address verified on Google Maps',
          latitude: hospLat,
          longitude: hospLon,
          google_maps_uri: `https://www.google.com/maps/search/?api=1&query=${hospLat},${hospLon}`,
          business_status: place.business_status || 'OPERATIONAL',
          source: 'GOOGLE_PLACES',
          source_retrieved_at: new Date().toISOString(),
          verification_status: 'NOT_AVAILABLE',
          capabilities: undefined, // Never invent unverified capabilities
          is_demo: false,
          distanceKm,
        };
      })
      .filter((h): h is Hospital => h !== null);

    hospitals.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

    return {
      success: true,
      hospitals,
      search_radius_km: radiusKm,
      configured: true,
      total_found: hospitals.length,
      api_endpoint: 'PLACES_LEGACY',
    };
  } catch (err: any) {
    return {
      success: false,
      hospitals: [],
      search_radius_km: radiusKm,
      configured: true,
      error: `Network error querying Google Places: ${err.message}`,
    };
  }
}
