import { NextResponse } from 'next/server';
import { getEmergencyById } from '@/lib/db/store';
import { sendHospitalEmergencyAlert } from '@/lib/services/emailService';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { emergency_id, report } = body;

    let targetReport = report;
    if (emergency_id) {
      targetReport = getEmergencyById(emergency_id);
    }

    if (!targetReport) {
      return NextResponse.json({ success: false, error: 'Emergency report not found' }, { status: 400 });
    }

    const result = await sendHospitalEmergencyAlert(targetReport);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Emergency alert sent successfully to hospital',
        recipient: result.recipient,
        timestamp: result.timestamp,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Report generated successfully, but automatic email delivery failed.',
        error: result.error,
        recipient: result.recipient,
      }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
