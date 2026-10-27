import { NextResponse } from 'next/server';
import { searchNearbyHospitalsOverpass } from '@/lib/services/overpassHospitalService';
import { searchNearbyHospitalsGoogle, isGooglePlacesConfigured } from '@/lib/services/googlePlacesService';
import { getHospitals } from '@/lib/db/store';
import { calculateHaversineDistance, isValidCoordinate } from '@/lib/utils/haversine';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const radius = searchParams.get('radius') || '5';
    const isDemoQuery = searchParams.get('demo') === 'true';

    if (!lat || !lon) {
      return NextResponse.json({
        success: false,
        error: 'Incident GPS latitude and longitude parameters are required.',
      }, { status: 400 });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    const radiusKm = parseFloat(radius);

    if (!isValidCoordinate(latitude, longitude)) {
      return NextResponse.json({
        success: false,
        error: `Invalid GPS coordinates provided (lat=${lat}, lon=${lon}). Coordinates must be valid numbers: lat [-90, 90], lon [-180, 180], and not [0,0].`,
      }, { status: 400 });
    }

    // EXPLICIT DEMO ISOLATION: Returned ONLY when ?demo=true is explicitly requested
    if (isDemoQuery) {
      const demoHospitals = getHospitals()
        .map((h) => ({
          ...h,
          is_demo: true,
          source: 'DEMO_DATA' as const,
          verification_status: 'VERIFIED' as const,
          distanceKm: calculateHaversineDistance(latitude, longitude, h.latitude, h.longitude),
        }))
        .filter((h) => (h.distanceKm || 0) <= radiusKm)
        .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

      return NextResponse.json({
        success: true,
        hospitals: demoHospitals,
        search_radius_km: radiusKm,
        is_demo_data: true,
        source_used: 'DEMO_DATA',
        configured: true,
        total_found: demoHospitals.length,
      });
    }

    // LIVE PRODUCTION MODE: Real Google Places or OpenStreetMap ONLY
    let hospitals = [];
    let sourceUsed: 'GOOGLE_PLACES' | 'OPENSTREETMAP' = 'OPENSTREETMAP';
    let providerError: string | undefined;

    if (isGooglePlacesConfigured()) {
      const googleResult = await searchNearbyHospitalsGoogle(latitude, longitude, radiusKm);
      if (googleResult.success && googleResult.hospitals.length > 0) {
        hospitals = googleResult.hospitals;
        sourceUsed = 'GOOGLE_PLACES';
      } else if (googleResult.error) {
        providerError = googleResult.error;
      }
    }

    if (hospitals.length === 0) {
      const osmResult = await searchNearbyHospitalsOverpass(latitude, longitude, radiusKm);
      if (osmResult.success && osmResult.hospitals.length > 0) {
        hospitals = osmResult.hospitals;
        sourceUsed = 'OPENSTREETMAP';
      } else if (!osmResult.success) {
        // STRICT REQUIREMENT 4 & 5: NEVER return seeded demo hospitals as live search results!
        return NextResponse.json({
          success: false,
          hospitals: [],
          search_radius_km: radiusKm,
          configured: isGooglePlacesConfigured(),
          source_used: sourceUsed,
          can_retry: true,
          is_demo_data: false,
          error: osmResult.error || providerError || 'No live hospitals found on OpenStreetMap near your location. Expand search radius or retry.',
        }, { status: 502 });
      }
    }

    return NextResponse.json({
      success: true,
      hospitals,
      search_radius_km: radiusKm,
      is_demo_data: false,
      configured: isGooglePlacesConfigured(),
      source_used: sourceUsed,
      total_found: hospitals.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
