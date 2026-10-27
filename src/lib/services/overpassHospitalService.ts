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
}

// In-memory server cache to protect Overpass API from rate limits
interface CacheEntry {
  timestamp: number;
  data: OverpassSearchResult;
}

const overpassCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 Minutes TTL

const OVERPASS_ENDPOINTS = [
  process.env.OVERPASS_API_URL || 'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

function getCacheKey(lat: number, lon: number, radiusKm: number): string {
  const roundedLat = lat.toFixed(2);
  const roundedLon = lon.toFixed(2);
  return `osm_${roundedLat}_${roundedLon}_r${radiusKm}`;
}

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
      error: `Invalid search coordinates: lat=${latitude}, lon=${longitude}. Latitude must be between -90 and 90, longitude between -180 and 180.`,
    };
  }

  // Optimize radius expansion: try initial radius (e.g. 10km), then max 25km fallback if 0 found
  const fallbackRadius = Math.max(initialRadiusKm, 25);
  const radiiToTry = initialRadiusKm === fallbackRadius ? [initialRadiusKm] : [initialRadiusKm, fallbackRadius];

  console.log(`[Overpass OSM] Coordinates acquired: Lat ${latitude}, Lon ${longitude}`);

  for (const radiusKm of radiiToTry) {
    const cacheKey = getCacheKey(latitude, longitude, radiusKm);
    const cached = overpassCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      console.log(`[Overpass OSM] Returning cached result for radius ${radiusKm}km (${cached.data.hospitals.length} hospitals)`);
      return {
        ...cached.data,
        cached: true,
      };
    }

    const radiusMeters = Math.round(radiusKm * 1000);
    console.log(`[Overpass OSM] Searching radius: ${radiusMeters}m (${radiusKm} km)`);

    const query = `
      [out:json][timeout:15];
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

    // Try Overpass endpoints in priority order (max 2 attempts per radius)
    for (const endpoint of OVERPASS_ENDPOINTS.slice(0, 3)) {
      console.log(`[Overpass OSM] Request started (endpoint: ${endpoint})`);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'EmergencyResponseApp/1.0 (academic-project; https://github.com/emergency-response)',
            'Accept': 'application/json',
          },
          body: `data=${encodeURIComponent(query)}`,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.warn(`[Overpass OSM] Endpoint ${endpoint} returned HTTP ${response.status}`);
          continue; // Try next endpoint
        }

        const data = await response.json();
        const rawElements = data.elements || [];

        const uniqueMap = new Map<string, Hospital>();

        rawElements.forEach((el: any) => {
          // Robust coordinate extraction for nodes (lat/lon) and ways/relations (center.lat/center.lon)
          const hospLat = el.lat || el.center?.lat;
          const hospLon = el.lon || el.center?.lon;

          // Exclude elements without valid coordinates - never substitute
          if (!isValidCoordinate(hospLat, hospLon)) return;

          const tags = el.tags || {};
          const osmId = `${el.type}/${el.id}`;

          // Format Name
          const name =
            tags.name ||
            tags['name:en'] ||
            tags.operator ||
            tags.brand ||
            `Healthcare Facility (${tags.amenity || tags.healthcare || 'OSM'})`;

          // Format Address
          let address = tags['addr:full'];
          if (!address) {
            const parts = [
              tags['addr:housenumber'],
              tags['addr:street'],
              tags['addr:suburb'],
              tags['addr:city'],
              tags['addr:postcode'],
            ].filter(Boolean);
            address = parts.length > 0 ? parts.join(', ') : 'Address on OpenStreetMap';
          }

          // Phone Number (Never invent)
          const phone = tags.phone || tags['contact:phone'] || tags.emergency_phone || undefined;

          // Website
          const website = tags.website || tags['contact:website'] || undefined;

          // Healthcare & Emergency Attributes
          const healthcareType = tags.amenity || tags.healthcare || tags.building || 'hospital';
          const emergencyCap = tags.emergency || (tags.amenity === 'hospital' ? 'yes' : 'Not available');

          // Distance calculation (Haversine straight-line geodesic distance)
          const distanceKm = calculateHaversineDistance(latitude, longitude, hospLat, hospLon);

          const uniqueKey = `${hospLat.toFixed(4)}_${hospLon.toFixed(4)}`;

          if (!uniqueMap.has(uniqueKey)) {
            uniqueMap.set(uniqueKey, {
              id: `osm-${el.type}-${el.id}`,
              osm_id: osmId,
              name,
              address,
              latitude: hospLat,
              longitude: hospLon,
              phone,
              website,
              google_maps_uri: `https://www.google.com/maps/search/?api=1&query=${hospLat},${hospLon}`,
              healthcare_type: healthcareType,
              emergency_capability: emergencyCap,
              business_status: 'OPERATIONAL',
              source: 'OPENSTREETMAP',
              source_retrieved_at: new Date().toISOString(),
              verification_status: 'UNVERIFIED',
              capabilities: undefined, // Do not invent capabilities not in source
              is_demo: false,
              distanceKm,
            });
          }
        });

        const hospitals = Array.from(uniqueMap.values());

        // Sort ascending by straight-line distance
        hospitals.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

        if (hospitals.length > 0) {
          const result: OverpassSearchResult = {
            success: true,
            hospitals,
            search_radius_km: radiusKm,
            total_found: hospitals.length,
            cached: false,
            endpoint_used: endpoint,
          };

          // Cache valid result
          overpassCache.set(cacheKey, { timestamp: now, data: result });
          return result;
        } else {
          console.warn(`[Overpass OSM] 0 hospitals found within ${radiusKm}km. Expanding search radius...`);
        }
      } catch (err: any) {
        console.error(`[Overpass OSM] Error connecting to ${endpoint}: ${err.message}`);
      }
    }
  }

  return {
    success: false,
    hospitals: [],
    search_radius_km: initialRadiusKm,
    total_found: 0,
    error: `No live hospitals found within 50 km on OpenStreetMap. Please check location coordinates or expand search area.`,
  };
}
