import { Hospital } from '@/types/emergency';
import { calculateHaversineDistance, isValidCoordinate } from '../utils/haversine';

export interface OverpassSearchResult {
  success: boolean;
  hospitals: Hospital[];
  search_radius_km: number;
  total_found: number;
  cached?: boolean;
  error?: string;
  endpoint_used?: string;
  source_used?: 'OPENSTREETMAP_OVERPASS' | 'OPENSTREETMAP_NOMINATIM';
}

// In-memory server cache to protect OpenStreetMap services from rate limits
interface CacheEntry {
  timestamp: number;
  data: OverpassSearchResult;
}

const osmCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 Minutes TTL

const OVERPASS_ENDPOINTS = [
  'https://overpass.private.coffee/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

function getCacheKey(lat: number, lon: number, radiusKm: number): string {
  const roundedLat = lat.toFixed(2);
  const roundedLon = lon.toFixed(2);
  return `osm_${roundedLat}_${roundedLon}_r${radiusKm}`;
}

/**
 * Searches for real hospitals near the given coordinates using OpenStreetMap Overpass API
 * with progressive radius expansion: 5 km -> 10 km -> 20 km.
 * If Overpass is congested or times out, it falls back to OpenStreetMap Nominatim Healthcare Search.
 */
export async function searchNearbyHospitalsOverpass(
  latitude: number,
  longitude: number,
  initialRadiusKm: number = 5
): Promise<OverpassSearchResult> {
  if (!isValidCoordinate(latitude, longitude)) {
    return {
      success: false,
      hospitals: [],
      search_radius_km: initialRadiusKm,
      total_found: 0,
      error: `Invalid search coordinates: lat=${latitude}, lon=${longitude}. Coordinates must be valid WGS84 numbers.`,
    };
  }

  // Progressive search radius: initial (typically 5km), expand to 10km, then 20km
  const radiiToTry: number[] = [];
  if (initialRadiusKm <= 5) {
    radiiToTry.push(5, 10, 20);
  } else if (initialRadiusKm <= 10) {
    radiiToTry.push(initialRadiusKm, 20);
  } else {
    radiiToTry.push(initialRadiusKm);
  }

  console.log(`[OSM Healthcare Discovery] Starting search at [${latitude}, ${longitude}] with radius progression: ${radiiToTry.join('km -> ')}km`);

  for (const radiusKm of radiiToTry) {
    const cacheKey = getCacheKey(latitude, longitude, radiusKm);
    const cached = osmCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      console.log(`[OSM] Returning cached result for radius ${radiusKm}km (${cached.data.hospitals.length} hospitals)`);
      if (cached.data.hospitals.length > 0) {
        return { ...cached.data, cached: true };
      }
    }

    // Attempt 1: Overpass API
    const overpassHospitals = await queryOverpass(latitude, longitude, radiusKm);
    if (overpassHospitals.length > 0) {
      const result: OverpassSearchResult = {
        success: true,
        hospitals: overpassHospitals,
        search_radius_km: radiusKm,
        total_found: overpassHospitals.length,
        cached: false,
        source_used: 'OPENSTREETMAP_OVERPASS',
      };
      osmCache.set(cacheKey, { timestamp: now, data: result });
      return result;
    }

    // Attempt 2: OpenStreetMap Nominatim Healthcare Search (Fast & Resilient Fallback)
    console.log(`[OSM] Overpass returned 0 for ${radiusKm}km. Trying OpenStreetMap Nominatim search...`);
    const nominatimHospitals = await queryNominatimHospitals(latitude, longitude, radiusKm);
    if (nominatimHospitals.length > 0) {
      const result: OverpassSearchResult = {
        success: true,
        hospitals: nominatimHospitals,
        search_radius_km: radiusKm,
        total_found: nominatimHospitals.length,
        cached: false,
        source_used: 'OPENSTREETMAP_NOMINATIM',
      };
      osmCache.set(cacheKey, { timestamp: now, data: result });
      return result;
    }

    console.warn(`[OSM] 0 hospitals found within ${radiusKm}km radius. Expanding radius...`);
  }

  return {
    success: false,
    hospitals: [],
    search_radius_km: radiiToTry[radiiToTry.length - 1],
    total_found: 0,
    error: `No healthcare facilities found within 20 km of your coordinates on OpenStreetMap. You can enter a specific address or city manually.`,
  };
}

/**
 * Executes a geographic query against OpenStreetMap Overpass servers
 */
async function queryOverpass(latitude: number, longitude: number, radiusKm: number): Promise<Hospital[]> {
  const radiusMeters = Math.round(radiusKm * 1000);
  const query = `
    [out:json][timeout:10];
    (
      node["amenity"="hospital"](around:${radiusMeters},${latitude},${longitude});
      way["amenity"="hospital"](around:${radiusMeters},${latitude},${longitude});
      relation["amenity"="hospital"](around:${radiusMeters},${latitude},${longitude});
      node["healthcare"="hospital"](around:${radiusMeters},${latitude},${longitude});
      way["healthcare"="hospital"](around:${radiusMeters},${latitude},${longitude});
      node["amenity"="clinic"](around:${radiusMeters},${latitude},${longitude});
      way["amenity"="clinic"](around:${radiusMeters},${latitude},${longitude});
      node["emergency"="yes"](around:${radiusMeters},${latitude},${longitude});
      way["emergency"="yes"](around:${radiusMeters},${latitude},${longitude});
    );
    out body center;
  `;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'EmergencyResponseApp/1.0 (academic-emergency-system; contact: health-support@system.local)',
          'Accept': 'application/json',
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const rawElements = data.elements || [];
      if (!rawElements || rawElements.length === 0) continue;

      const uniqueMap = new Map<string, Hospital>();

      rawElements.forEach((el: any) => {
        const hospLat = el.lat || el.center?.lat;
        const hospLon = el.lon || el.center?.lon;

        if (!isValidCoordinate(hospLat, hospLon)) return;

        const tags = el.tags || {};
        const name =
          tags.name ||
          tags['name:en'] ||
          tags.operator ||
          tags.brand ||
          `Healthcare Facility (${tags.amenity || tags.healthcare || 'Hospital'})`;

        // Address resolution from OpenStreetMap tags
        let address = tags['addr:full'];
        if (!address) {
          const parts = [
            tags['addr:housenumber'],
            tags['addr:street'],
            tags['addr:suburb'],
            tags['addr:city'] || tags['addr:town'] || tags['addr:district'],
            tags['addr:postcode'],
          ].filter(Boolean);
          address = parts.length > 0 ? parts.join(', ') : 'Address registered on OpenStreetMap';
        }

        // Phone number
        const phone = tags.phone || tags['contact:phone'] || tags.emergency_phone || tags['contact:mobile'] || undefined;
        const website = tags.website || tags['contact:website'] || undefined;

        // Emergency capability & healthcare type
        const healthcareType = tags.healthcare || tags.amenity || 'hospital';
        const emergencyCap = tags.emergency === 'yes' ? 'yes' : (tags.amenity === 'hospital' ? 'yes' : 'unverified');

        // Haversine straight-line distance
        const distanceKm = calculateHaversineDistance(latitude, longitude, hospLat, hospLon);

        // Deduplicate nearby duplicate nodes/ways within ~50 meters
        const uniqueKey = `${hospLat.toFixed(3)}_${hospLon.toFixed(3)}`;

        if (!uniqueMap.has(uniqueKey)) {
          uniqueMap.set(uniqueKey, {
            id: `osm-${el.type}-${el.id}`,
            osm_id: `${el.type}/${el.id}`,
            name,
            address,
            latitude: hospLat,
            longitude: hospLon,
            phone,
            website,
            google_maps_uri: `https://www.google.com/maps/dir/?api=1&destination=${hospLat},${hospLon}`,
            healthcare_type: healthcareType,
            emergency_capability: emergencyCap,
            business_status: 'OPERATIONAL',
            source: 'OPENSTREETMAP',
            source_retrieved_at: new Date().toISOString(),
            verification_status: tags.emergency === 'yes' ? 'VERIFIED' : 'UNVERIFIED',
            capabilities: tags.emergency === 'yes' ? {
              has_emergency_department: true,
              has_icu: tags['healthcare:speciality']?.includes('intensive') || false,
              has_trauma_center: tags['emergency'] === 'yes',
              has_blood_bank: false,
              has_cardiology: false,
              has_neurology: false,
              has_orthopedics: false,
              has_burn_unit: false,
              has_ambulance: Boolean(tags.ambulance),
              has_operation_theatre: true,
              is_emergency_available: true,
            } : undefined,
            is_demo: false,
            distanceKm,
          });
        }
      });

      const hospitals = Array.from(uniqueMap.values());
      hospitals.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
      return hospitals;
    } catch {
      // Continue to next endpoint
    }
  }

  return [];
}

/**
 * Searches for real hospitals using OpenStreetMap Nominatim Bounding-Box API.
 * High-speed, resilient fallback when Overpass is congested.
 */
async function queryNominatimHospitals(latitude: number, longitude: number, radiusKm: number): Promise<Hospital[]> {
  try {
    // Convert radiusKm to approximate degrees delta
    const deltaLat = radiusKm / 111.0;
    const deltaLon = radiusKm / (111.0 * Math.cos((latitude * Math.PI) / 180));

    const left = (longitude - deltaLon).toFixed(5);
    const right = (longitude + deltaLon).toFixed(5);
    const top = (latitude + deltaLat).toFixed(5);
    const bottom = (latitude - deltaLat).toFixed(5);

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=hospital&viewbox=${left},${top},${right},${bottom}&bounded=1&limit=25&addressdetails=1&extratags=1`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'EmergencyResponseApp/1.0 (academic-emergency-response-system)',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) return [];

    const results = await response.json();
    if (!Array.isArray(results) || results.length === 0) return [];

    const uniqueMap = new Map<string, Hospital>();

    results.forEach((item: any) => {
      const hospLat = parseFloat(item.lat);
      const hospLon = parseFloat(item.lon);

      if (!isValidCoordinate(hospLat, hospLon)) return;

      const addressObj = item.address || {};
      const extraTags = item.extratags || {};

      // Clean name: use amenity or specific name if available
      const cleanName =
        addressObj.amenity ||
        addressObj.hospital ||
        addressObj.clinic ||
        item.name ||
        item.display_name.split(',')[0];

      // Formatted address
      const addressParts = [
        addressObj.road,
        addressObj.neighbourhood || addressObj.suburb,
        addressObj.city || addressObj.town || addressObj.county,
        addressObj.state,
        addressObj.postcode,
      ].filter(Boolean);
      const address = addressParts.length > 0 ? addressParts.join(', ') : item.display_name;

      const phone = extraTags.phone || extraTags['contact:phone'] || extraTags.emergency_phone || undefined;
      const website = extraTags.website || extraTags['contact:website'] || undefined;
      const emergencyCap = extraTags.emergency === 'yes' ? 'yes' : 'unverified';

      const distanceKm = calculateHaversineDistance(latitude, longitude, hospLat, hospLon);

      const uniqueKey = `${hospLat.toFixed(3)}_${hospLon.toFixed(3)}`;

      if (!uniqueMap.has(uniqueKey)) {
        uniqueMap.set(uniqueKey, {
          id: `osm-nom-${item.place_id || item.osm_id}`,
          osm_id: `${item.osm_type}/${item.osm_id}`,
          name: cleanName,
          address,
          latitude: hospLat,
          longitude: hospLon,
          phone,
          website,
          google_maps_uri: `https://www.google.com/maps/dir/?api=1&destination=${hospLat},${hospLon}`,
          healthcare_type: extraTags.healthcare || 'hospital',
          emergency_capability: emergencyCap,
          business_status: 'OPERATIONAL',
          source: 'OPENSTREETMAP',
          source_retrieved_at: new Date().toISOString(),
          verification_status: extraTags.emergency === 'yes' ? 'VERIFIED' : 'UNVERIFIED',
          capabilities: undefined, // Labeled unverified as required by strict academic rules
          is_demo: false,
          distanceKm,
        });
      }
    });

    const hospitals = Array.from(uniqueMap.values());
    hospitals.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    return hospitals;
  } catch (err: any) {
    console.warn('[OSM Nominatim] Query attempt failed:', err.message);
    return [];
  }
}
