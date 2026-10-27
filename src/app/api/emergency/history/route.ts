import { NextResponse } from 'next/server';
import { getEmergencies } from '@/lib/db/store';

export async function GET() {
  try {
    const emergencies = getEmergencies();
    return NextResponse.json({
      success: true,
      emergencies,
      reports: emergencies,
      total: emergencies.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
