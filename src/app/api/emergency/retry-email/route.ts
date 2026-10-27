import { NextResponse } from 'next/server';
import { getEmergencyById } from '@/lib/db/store';
import { sendHospitalEmergencyAlert } from '@/lib/services/emailService';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { emergency_id } = body;

    const report = getEmergencyById(emergency_id);
    if (!report) {
      return NextResponse.json({ success: false, error: 'Emergency report not found' }, { status: 404 });
    }

    const result = await sendHospitalEmergencyAlert(report);

    return NextResponse.json({
      success: result.success,
      recipient: result.recipient,
      timestamp: result.timestamp,
      error: result.error,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
