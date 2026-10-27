import { NextResponse } from 'next/server';
import { saveEmergency } from '@/lib/db/store';
import { EmergencyReport } from '@/types/emergency';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { reports } = body;

    if (!reports || !Array.isArray(reports) || reports.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Array of reports required for synchronization' },
        { status: 400 }
      );
    }

    const syncedReports: EmergencyReport[] = [];
    const errors: any[] = [];

    for (const report of reports) {
      try {
        const saved = saveEmergency({
          ...report,
          status: report.status || 'REPORTED',
          created_at: report.created_at || new Date().toISOString(),
        });
        syncedReports.push(saved);
      } catch (err: any) {
        errors.push({ id: report.id, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      synced_count: syncedReports.length,
      failed_count: errors.length,
      synced_reports: syncedReports,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Offline synchronization failed' },
      { status: 500 }
    );
  }
}
