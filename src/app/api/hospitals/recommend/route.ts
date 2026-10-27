import { NextResponse } from 'next/server';
import { rankNearbyHospitalsForEmergency } from '@/lib/services/hospitalMatchingService';
import { isValidCoordinate } from '@/lib/utils/haversine';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      latitude,
      longitude,
      emergency_type = 'Medical Emergency',
      severity = 'HIGH',
      required_facilities = [],
      radius_km = 5,
      source,
      is_demo = false,
    } = body;

    const lat = Number(latitude);
    const lon = Number(longitude);

    if (!isValidCoordinate(lat, lon)) {
      return NextResponse.json({
        success: false,
        error: `Invalid coordinates: lat=${latitude}, lon=${longitude}. Coordinates must be valid non-zero numbers: lat [-90, 90], lon [-180, 180].`,
      }, { status: 400 });
    }

    const location = {
      latitude: lat,
      longitude: lon,
      source: (source || (is_demo ? 'DEMO' : 'DEVICE_GPS')) as any,
      is_demo: Boolean(is_demo),
    };

    const matchResult = await rankNearbyHospitalsForEmergency(
      location,
      emergency_type,
      severity,
      required_facilities,
      Number(radius_km),
      Boolean(is_demo)
    );

    return NextResponse.json({
      success: matchResult.success,
      recommended_hospital: matchResult.recommendedHospital,
      nearby_hospitals: matchResult.rankedHospitals,
      nearby_emergency_hospitals: matchResult.nearbyEmergencyHospitals,
      closest_facilities: matchResult.closestFacilities,
      matching_reason: matchResult.matchingReason,
      source_used: matchResult.source_used,
      is_demo_data: matchResult.is_demo_data,
      can_retry: matchResult.can_retry,
      configured: matchResult.configured,
      error: matchResult.error,
      // ── Transparency notes for consumers of this API ──────────────────────────
      // All distances are straight-line ("as-the-crow-flies") Haversine geodesic
      // values. They are NOT road-network driving distances or travel times.
      // Capability lists (ICU, Trauma Center, etc.) are derived from the detected
      // emergency domain and OpenStreetMap 'healthcare_type' tags. They are NOT
      // confirmed against live hospital records, real-time bed counts, or any
      // Electronic Health Record / FHIR system.
      methodology_notes: {
        distance_method: 'Haversine straight-line geodesic (R=6371 km) — not road distance',
        capability_source: matchResult.is_demo_data
          ? 'Pre-configured demo hospital profiles (simulated — not real hospital data)'
          : 'OpenStreetMap healthcare_type tag and emergency_capability flag — capabilities are NOT individually verified',
        ranking_basis: 'Composite score: proximity (40%), emergency_capability tag (25%), verification status (15%), facility type (20%)',
        road_navigation: 'Turn-by-turn driving directions are delegated to the Google Maps deep-link provided in each hospital record',
      },
    }, { status: matchResult.success ? 200 : (matchResult.can_retry ? 502 : 400) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
