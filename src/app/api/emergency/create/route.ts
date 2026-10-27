import { NextResponse } from 'next/server';
import { EmergencyReport } from '@/types/emergency';
import { formatReportId } from '@/lib/utils/formatters';
import { rankNearbyHospitalsForEmergency } from '@/lib/services/hospitalMatchingService';
import { saveEmergency } from '@/lib/db/store';
import { sendHospitalEmergencyAlert } from '@/lib/services/emailService';
import { isValidCoordinate } from '@/lib/utils/haversine';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Request body must be a valid JSON object.' }, { status: 400 });
    }

    const {
      emergency_type,
      description,
      voice_transcription,
      people_affected = 1,
      location,
      ai_assessment,
      accident_detection,
      media_urls = [],
      // Explicitly discard client-supplied role or user_id to prevent privilege spoofing
    } = body;

    const trimmedDesc = typeof description === 'string' ? description.trim() : '';
    const trimmedVoice = typeof voice_transcription === 'string' ? voice_transcription.trim() : '';
    const trimmedType = typeof emergency_type === 'string' ? emergency_type.trim() : '';

    if (!trimmedDesc && !trimmedVoice && !trimmedType) {
      return NextResponse.json({
        success: false,
        error: 'An emergency description, emergency type, or voice transcription is required to report an incident.',
      }, { status: 400 });
    }

    const safePeopleAffected = Math.max(1, Math.min(1000, Number(people_affected) || 1));

    const id = `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const report_id = formatReportId();
    const created_at = new Date().toISOString();

    const lat = Number(location?.latitude);
    const lon = Number(location?.longitude);
    const isExplicitDemo = Boolean(location?.is_demo) || location?.source === 'DEMO';

    if (!isValidCoordinate(lat, lon)) {
      return NextResponse.json({
        success: false,
        error: `Valid coordinates are required to submit an emergency report (received lat=${location?.latitude}, lon=${location?.longitude}). Please enable browser GPS permissions, select a manual pin, or explicitly choose Demo mode.`,
      }, { status: 400 });
    }

    const locSource = isExplicitDemo ? 'DEMO' : (location?.source === 'MANUAL' ? 'MANUAL' : 'DEVICE_GPS');

    const userLoc = {
      latitude: lat,
      longitude: lon,
      accuracy: Number(location?.accuracy) || (isExplicitDemo ? 50 : 15),
      quality: location?.quality || (isExplicitDemo ? 'LOW' : 'HIGH'),
      source: locSource as any,
      is_demo: isExplicitDemo,
      address: location?.address || (isExplicitDemo ? 'Demo Coordinates (Simulated)' : `GPS Lock (${lat.toFixed(4)}, ${lon.toFixed(4)})`),
      timestamp: location?.timestamp || created_at,
    };

    let recommendedHosp: any = undefined;
    let matchingReason = 'Matched emergency healthcare facility based on triage criteria.';
    let rankedHospitals: any[] = [];

    try {
      const matchResult = await rankNearbyHospitalsForEmergency(
        userLoc,
        emergency_type || 'Medical Emergency',
        ai_assessment?.severity || 'HIGH',
        ai_assessment?.required_facilities || ['Emergency Department'],
        5,
        isExplicitDemo
      );
      recommendedHosp = matchResult.recommendedHospital;
      if (matchResult.matchingReason) matchingReason = matchResult.matchingReason;
      if (matchResult.rankedHospitals) rankedHospitals = matchResult.rankedHospitals;
    } catch (matchErr: any) {
      console.warn('[CREATE_EMERGENCY] Hospital matching warning, continuing with save:', matchErr.message);
    }

    const report: EmergencyReport = {
      id,
      report_id,
      created_at,
      emergency_type: emergency_type || accident_detection?.incident_type || 'Medical Incident',
      description: description || 'Emergency incident reported.',
      people_affected: safePeopleAffected,
      severity: ai_assessment?.severity || 'HIGH',
      ai_confidence: accident_detection?.confidence ? Math.round(accident_detection.confidence * 100) : (ai_assessment?.confidence || 90),
      status: 'HOSPITAL_RECOMMENDED',
      location: userLoc,
      voice: voice_transcription
        ? {
            original_transcription: voice_transcription,
            detected_language: 'English',
            transcription_timestamp: created_at,
          }
        : undefined,
      media_urls,
      ai_assessment,
      accident_detection: accident_detection || ai_assessment?.accident_detection,
      detailed_analysis: ai_assessment?.detailed_analysis,
      recommended_hospital_id: recommendedHosp?.id,
      recommended_hospital: recommendedHosp,
      nearby_hospitals: rankedHospitals,
      timeline: [
        { status: 'NEW', label: 'Emergency submitted', timestamp: created_at },
        { status: 'ANALYZING', label: 'AI & computer vision analysis completed', timestamp: created_at },
        {
          status: 'HOSPITAL_RECOMMENDED',
          label: recommendedHosp ? `Matched ${recommendedHosp.name} (${recommendedHosp.distanceKm} km straight-line distance)` : 'Nearby hospital query complete',
          timestamp: created_at,
        },
      ],
      is_demo: isExplicitDemo || process.env.DEMO_MODE === 'true',
    };

    saveEmergency(report);

    sendHospitalEmergencyAlert(report).catch((err) =>
      console.error('Background email alert dispatch error:', err)
    );

    return NextResponse.json({
      success: true,
      report,
      recommended_hospital: recommendedHosp,
      matching_reason: matchingReason,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
