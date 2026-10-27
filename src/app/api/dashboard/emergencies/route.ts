import { NextResponse } from 'next/server';
import { getEmergencies, getHospitals } from '@/lib/db/store';

export async function GET() {
  try {
    const emergencies = getEmergencies();
    const hospitals = getHospitals();

    // Compute stats
    const activeCount = emergencies.filter((e) => e.status !== 'RESOLVED').length;
    const criticalCount = emergencies.filter((e) => e.severity === 'CRITICAL' && e.status !== 'RESOLVED').length;
    const highCount = emergencies.filter((e) => e.severity === 'HIGH' && e.status !== 'RESOLVED').length;
    const reportsSentCount = emergencies.filter((e) => e.email_status?.sent).length;
    const awaitingResponseCount = emergencies.filter((e) => e.status === 'ALERT_SENT' || e.status === 'HOSPITAL_RECOMMENDED').length;
    const resolvedCount = emergencies.filter((e) => e.status === 'RESOLVED').length;

    return NextResponse.json({
      success: true,
      stats: {
        active: activeCount,
        critical: criticalCount,
        high: highCount,
        reports_sent: reportsSentCount,
        awaiting_response: awaitingResponseCount,
        resolved: resolvedCount,
        hospitals_available: hospitals.length,
      },
      emergencies,
      hospitals,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
