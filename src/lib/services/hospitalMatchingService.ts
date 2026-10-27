import { Hospital, EmergencySeverity, LocationData } from '@/types/emergency';
import { calculateHaversineDistance, isValidCoordinate } from '../utils/haversine';
import { searchNearbyHospitalsOverpass } from './overpassHospitalService';
import { searchNearbyHospitalsGoogle, isGooglePlacesConfigured } from './googlePlacesService';
import { getHospitals } from '../db/store';

export interface HospitalMatchResult {
  success: boolean;
  recommendedHospital?: Hospital;
  rankedHospitals: Hospital[];
  nearbyEmergencyHospitals?: Hospital[];
  closestFacilities?: Hospital[];
  matchingReason: string;
  total_found?: number;
  source_used?: 'GOOGLE_PLACES' | 'OPENSTREETMAP' | 'DEMO_DATA';
  configured?: boolean;
  can_retry?: boolean;
  is_demo_data?: boolean;
  error?: string;
}

export async function rankNearbyHospitalsForEmergency(
  userLocation: LocationData,
  emergencyType: string,
  severity: EmergencySeverity,
  requiredFacilities: string[] = [],
  radiusKm: number = 5,
  allowExplicitDemo: boolean = false
): Promise<HospitalMatchResult> {
  // Validate coordinates strictly - never proceed with invalid coords
  if (!isValidCoordinate(userLocation.latitude, userLocation.longitude)) {
    return {
      success: false,
      rankedHospitals: [],
      nearbyEmergencyHospitals: [],
      closestFacilities: [],
      matchingReason: 'Invalid location coordinates.',
      error: `Invalid GPS coordinates: lat=${userLocation.latitude}, lon=${userLocation.longitude}. Coordinates must be valid non-zero WGS84 numbers.`,
      can_retry: false,
      total_found: 0,
    };
  }

  // Explicit demo mode ONLY if flagged by caller or user location source is DEMO
  const isDemoMode = allowExplicitDemo || userLocation.source === 'DEMO' || process.env.DEMO_MODE === 'true';

  let hospitals: Hospital[] = [];
  let sourceUsed: 'GOOGLE_PLACES' | 'OPENSTREETMAP' | 'DEMO_DATA' = 'OPENSTREETMAP';

  if (isDemoMode) {
    // Isolated DEMO Mode: explicitly labeled, never masquerading as live
    sourceUsed = 'DEMO_DATA';
    hospitals = getHospitals().map((h) => ({
      ...h,
      is_demo: true,
      source: 'DEMO_DATA' as const,
      verification_status: 'VERIFIED' as const,
      distanceKm: calculateHaversineDistance(userLocation.latitude, userLocation.longitude, h.latitude, h.longitude),
    }));
  } else {
    // LIVE PRODUCTION MODE: Real Google Places or OpenStreetMap ONLY
    if (isGooglePlacesConfigured()) {
      console.log(`[HOSPITAL_MATCH] Querying Google Places at [${userLocation.latitude}, ${userLocation.longitude}] r=${radiusKm}km`);
      const googleResult = await searchNearbyHospitalsGoogle(userLocation.latitude, userLocation.longitude, radiusKm);
      if (googleResult.success && googleResult.hospitals.length > 0) {
        hospitals = googleResult.hospitals;
        sourceUsed = 'GOOGLE_PLACES';
      } else if (googleResult.error) {
        console.warn(`[HOSPITAL_MATCH] Google Places failed: ${googleResult.error}. Falling back to OpenStreetMap Overpass.`);
      }
    }

    // Fallback to live OpenStreetMap Overpass API
    if (hospitals.length === 0) {
      console.log(`[HOSPITAL_MATCH] Querying OpenStreetMap Overpass at [${userLocation.latitude}, ${userLocation.longitude}] r=${radiusKm}km`);
      const overpassResult = await searchNearbyHospitalsOverpass(userLocation.latitude, userLocation.longitude, radiusKm);

      if (overpassResult.success && overpassResult.hospitals.length > 0) {
        hospitals = overpassResult.hospitals;
        sourceUsed = 'OPENSTREETMAP';
      } else {
        // STRICT REQUIREMENT 4 & 5: NEVER return seeded demo hospitals as genuine live search results!
        console.warn(`[HOSPITAL_MATCH] Live GIS search returned 0 hospitals or failed: ${overpassResult.error}`);
        return {
          success: false,
          rankedHospitals: [],
          nearbyEmergencyHospitals: [],
          closestFacilities: [],
          source_used: sourceUsed,
          configured: isGooglePlacesConfigured(),
          can_retry: true,
          is_demo_data: false,
          matchingReason: 'Live hospital search failed: No healthcare facilities were found near these coordinates on live map registries.',
          error: overpassResult.error || 'Live healthcare discovery failed. Check network or expand search radius.',
          total_found: 0,
        };
      }
    }
  }

  if (hospitals.length === 0) {
    return {
      success: false,
      rankedHospitals: [],
      nearbyEmergencyHospitals: [],
      closestFacilities: [],
      source_used: sourceUsed,
      configured: isGooglePlacesConfigured(),
      can_retry: true,
      is_demo_data: isDemoMode,
      matchingReason: `No healthcare facilities found within ${radiusKm} km radius using live GPS queries.`,
      error: `No hospitals found within ${radiusKm} km. Try expanding the search radius.`,
      total_found: 0,
    };
  }

  // Capability & Distance Transparent Scoring Formula
  const scoredHospitals = hospitals.map((hosp) => {
    const distanceKm = hosp.distanceKm !== undefined
      ? hosp.distanceKm
      : calculateHaversineDistance(userLocation.latitude, userLocation.longitude, hosp.latitude, hosp.longitude);

    // 1. Straight-Line Distance Score (Max 40 pts)
    const distanceScore = Math.max(0, Math.round(40 - distanceKm * 3));

    // 2. Capability Match Score (Max 40 pts)
    let capabilityMatchScore = 0;
    const isEmergencyDeptAvailable = hosp.emergency_capability === 'yes' || hosp.healthcare_type === 'hospital';
    if (isEmergencyDeptAvailable) {
      capabilityMatchScore += 25;
    }
    if (hosp.verification_status === 'VERIFIED') {
      capabilityMatchScore += 15;
    }

    // 3. Facility Type Score (Max 20 pts)
    let typeScore = 10;
    if (hosp.healthcare_type === 'hospital' || hosp.healthcare_type === 'emergency') {
      typeScore = 20;
    } else if (hosp.healthcare_type === 'clinic') {
      typeScore = 12;
    }

    const suitabilityScore = Math.min(100, distanceScore + capabilityMatchScore + typeScore);

    const matchReasons: string[] = [];
    if (hosp.source === 'GOOGLE_PLACES') {
      matchReasons.push(`Google Places Verified Location (${hosp.business_status || 'OPERATIONAL'})`);
    } else if (hosp.source === 'DEMO_DATA') {
      matchReasons.push('Demonstration Hospital Profile (Simulated Benchmark)');
    } else if (isEmergencyDeptAvailable) {
      matchReasons.push(`Emergency care indicated (${hosp.healthcare_type || 'hospital'})`);
    } else {
      matchReasons.push('Capability details subject to on-scene verification');
    }

    // Explicitly label as straight-line distance
    matchReasons.push(`${distanceKm} km straight-line distance (as-the-crow-flies)`);

    let recommendationNote = `Matches the detected emergency requirements (${emergencyType}) and is among the closest available facilities (${distanceKm} km straight-line distance).`;
    if (hosp.source === 'GOOGLE_PLACES') {
      recommendationNote = `Live Google Places hospital result (${distanceKm} km straight-line). Operational status: ${hosp.business_status || 'OPERATIONAL'}.`;
    } else if (hosp.source === 'DEMO_DATA') {
      recommendationNote = `[DEMO FACILITY] Pre-configured benchmark facility (${distanceKm} km straight-line). Used for evaluation only.`;
    } else if (hosp.emergency_capability !== 'yes' && hosp.verification_status !== 'VERIFIED') {
      recommendationNote = `Capability information is incomplete on OpenStreetMap. Please confirm emergency readiness with local emergency services (${distanceKm} km straight-line).`;
    }

    return {
      ...hosp,
      distanceKm,
      suitabilityScore,
      matchReasons,
      recommendationNote,
    };
  });

  // Sort descending by total suitability score (best match first)
  scoredHospitals.sort((a, b) => (b.suitabilityScore || 0) - (a.suitabilityScore || 0));

  const recommendedHospital = scoredHospitals[0];

  // 3-Tier Categorization
  const nearbyEmergencyHospitals = scoredHospitals.filter(
    (h) => h.id !== recommendedHospital.id && (h.emergency_capability === 'yes' || h.healthcare_type === 'hospital' || h.source === 'GOOGLE_PLACES')
  );

  const closestFacilities = [...scoredHospitals]
    .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0))
    .filter((h) => h.id !== recommendedHospital.id && !nearbyEmergencyHospitals.some((e) => e.id === h.id));

  return {
    success: true,
    recommendedHospital,
    rankedHospitals: scoredHospitals,
    nearbyEmergencyHospitals,
    closestFacilities,
    matchingReason: recommendedHospital.recommendationNote || `Recommended facility matched for ${emergencyType}.`,
    total_found: scoredHospitals.length,
    source_used: sourceUsed,
    is_demo_data: isDemoMode,
    configured: isGooglePlacesConfigured(),
  };
}
