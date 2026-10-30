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

/**
 * Evaluates patient emergency clinical requirements based on emergency type, severity, and required facilities
 */
function evaluateEmergencyRequirements(emergencyType: string, severity: EmergencySeverity, requiredFacilities: string[] = []) {
  const typeLower = (emergencyType || '').toLowerCase();
  const reqStr = requiredFacilities.join(' ').toLowerCase();

  const isSevereBleedingOrAccident =
    typeLower.includes('accident') ||
    typeLower.includes('bleed') ||
    typeLower.includes('trauma') ||
    reqStr.includes('trauma') ||
    reqStr.includes('blood bank');

  const isHeadInjuryOrUnconscious =
    typeLower.includes('unconscious') ||
    typeLower.includes('faint') ||
    typeLower.includes('head') ||
    typeLower.includes('coma') ||
    reqStr.includes('icu') ||
    reqStr.includes('neurology');

  const isCardiacOrChestPain =
    typeLower.includes('chest pain') ||
    typeLower.includes('cardiac') ||
    typeLower.includes('heart') ||
    reqStr.includes('cath lab') ||
    reqStr.includes('cardiology');

  const isFractureOrFall =
    typeLower.includes('fall') ||
    typeLower.includes('fracture') ||
    typeLower.includes('bone') ||
    typeLower.includes('ortho') ||
    reqStr.includes('orthopedics') ||
    reqStr.includes('x-ray');

  const isCritical = severity === 'CRITICAL';

  return {
    isSevereBleedingOrAccident,
    isHeadInjuryOrUnconscious,
    isCardiacOrChestPain,
    isFractureOrFall,
    isCritical,
  };
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
        console.warn(`[HOSPITAL_MATCH] Google Places failed: ${googleResult.error}. Falling back to OpenStreetMap.`);
      }
    }

    // Fallback to live OpenStreetMap (Overpass + Nominatim resilient progressive search)
    if (hospitals.length === 0) {
      console.log(`[HOSPITAL_MATCH] Querying OpenStreetMap at [${userLocation.latitude}, ${userLocation.longitude}] r=${radiusKm}km`);
      const osmResult = await searchNearbyHospitalsOverpass(userLocation.latitude, userLocation.longitude, radiusKm);

      if (osmResult.success && osmResult.hospitals.length > 0) {
        hospitals = osmResult.hospitals;
        sourceUsed = 'OPENSTREETMAP';
      } else {
        console.warn(`[HOSPITAL_MATCH] Live GIS search returned 0 hospitals or failed: ${osmResult.error}`);
        return {
          success: false,
          rankedHospitals: [],
          nearbyEmergencyHospitals: [],
          closestFacilities: [],
          source_used: sourceUsed,
          configured: isGooglePlacesConfigured(),
          can_retry: true,
          is_demo_data: false,
          matchingReason: 'No healthcare facilities found within search radius on live map registries.',
          error: osmResult.error || `No healthcare facilities found within ${radiusKm} km. Try expanding the search radius.`,
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
      error: `No hospitals found within ${radiusKm} km. Try expanding the search radius to 10 km or 20 km.`,
      total_found: 0,
    };
  }

  const clinical = evaluateEmergencyRequirements(emergencyType, severity, requiredFacilities);

  // Capability & Distance Transparent Scoring Formula
  const scoredHospitals = hospitals.map((hosp) => {
    const distanceKm = hosp.distanceKm !== undefined
      ? hosp.distanceKm
      : calculateHaversineDistance(userLocation.latitude, userLocation.longitude, hosp.latitude, hosp.longitude);

    // 1. Straight-Line Distance Score (Max 45 pts)
    // Decreases as distance increases; closer hospitals gain highest proximity advantage
    const distanceScore = Math.max(0, Math.round(45 - distanceKm * 2.5));

    // 2. Verified Emergency & Clinical Match Score (Max 40 pts)
    let clinicalMatchScore = 0;
    const isEmergencyConfirmed = hosp.emergency_capability === 'yes';
    const isHospitalType = hosp.healthcare_type === 'hospital';

    if (isEmergencyConfirmed) {
      clinicalMatchScore += 25; // Verified 24/7 Emergency care
    } else if (isHospitalType) {
      clinicalMatchScore += 15; // Full Hospital (likely has acute care)
    } else {
      clinicalMatchScore += 5;  // Clinic / Healthcare center
    }

    // Emergency type-specific prioritization
    if (clinical.isCritical && isEmergencyConfirmed) {
      clinicalMatchScore += 15; // Critical emergency prioritization
    } else if (clinical.isSevereBleedingOrAccident && (isEmergencyConfirmed || isHospitalType)) {
      clinicalMatchScore += 10; // Trauma & surgical capability
    } else if (clinical.isHeadInjuryOrUnconscious && isHospitalType) {
      clinicalMatchScore += 10; // Diagnostic / ICU capabilities
    } else if (clinical.isCardiacOrChestPain && isHospitalType) {
      clinicalMatchScore += 10; // Cardiac emergency care
    } else if (clinical.isFractureOrFall && (isHospitalType || isEmergencyConfirmed)) {
      clinicalMatchScore += 8;  // X-Ray / Orthopedic care
    }

    // 3. Data Verification Status Score (Max 15 pts)
    let verificationScore = 0;
    if (hosp.verification_status === 'VERIFIED') {
      verificationScore = 15;
    } else if (hosp.source === 'GOOGLE_PLACES') {
      verificationScore = 10;
    } else {
      verificationScore = 5; // Unverified map data
    }

    const suitabilityScore = Math.min(100, distanceScore + clinicalMatchScore + verificationScore);

    const matchReasons: string[] = [];
    if (hosp.source === 'GOOGLE_PLACES') {
      matchReasons.push(`Google Places Verified Location (${hosp.business_status || 'OPERATIONAL'})`);
    } else if (hosp.source === 'DEMO_DATA') {
      matchReasons.push('Demonstration Hospital Profile (Simulated Benchmark)');
    } else if (isEmergencyConfirmed) {
      matchReasons.push('Verified Emergency Care department available ✓');
    } else {
      matchReasons.push('Emergency capabilities unverified in public map data');
    }

    if (clinical.isCritical && isEmergencyConfirmed) {
      matchReasons.push('Prioritized for CRITICAL life-safety emergency');
    } else if (clinical.isSevereBleedingOrAccident) {
      matchReasons.push('Evaluated for trauma and acute emergency support');
    } else if (clinical.isHeadInjuryOrUnconscious) {
      matchReasons.push('Evaluated for acute diagnostic and emergency care');
    }

    matchReasons.push(`${distanceKm} km straight-line distance (Haversine formula)`);

    // Transparent recommendation note
    let recommendationNote = `Nearest facility matching clinical triage for ${emergencyType} (${distanceKm} km straight-line distance).`;
    if (hosp.source === 'GOOGLE_PLACES') {
      recommendationNote = `Google Places verified hospital result (${distanceKm} km straight-line). Operational: ${hosp.business_status || 'OPERATIONAL'}.`;
    } else if (hosp.source === 'DEMO_DATA') {
      recommendationNote = `[DEMO BENCHMARK] Pre-configured testing profile (${distanceKm} km straight-line).`;
    } else if (hosp.verification_status === 'UNVERIFIED') {
      recommendationNote = `Located ${distanceKm} km away. Note: Specific emergency facilities are unverified in map registry; call ahead or confirm with local EMS.`;
    }

    return {
      ...hosp,
      distanceKm,
      suitabilityScore,
      matchReasons,
      recommendationNote,
    };
  });

  // Sort descending by suitability score (best match first)
  scoredHospitals.sort((a, b) => (b.suitabilityScore || 0) - (a.suitabilityScore || 0));

  const recommendedHospital = scoredHospitals[0];

  // 3-Tier Categorization for UI Clarity
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
