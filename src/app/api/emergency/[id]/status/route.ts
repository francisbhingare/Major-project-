import { NextResponse } from 'next/server';
import { updateEmergencyStatus } from '@/lib/db/store';
import { EmergencyStatus } from '@/types/emergency';

import { cookies } from 'next/headers';
import { getAdminSession } from '@/lib/auth/authStore';

const VALID_EMERGENCY_STATUSES: EmergencyStatus[] = [
  'NEW',
  'ANALYZING',
  'HOSPITAL_RECOMMENDED',
  'REPORT_GENERATED',
  'ALERT_SENT',
  'ACKNOWLEDGED',
  'IN_RESPONSE',
  'RESOLVED',
  'REPORTED',
  'DISPATCHED',
];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'A valid emergency ID or report ID is required.' }, { status: 400 });
    }

    const body = await req.json();
    const { status, detail } = body as { status: EmergencyStatus; detail?: string };

    if (!status) {
      return NextResponse.json({ success: false, error: 'Status is required.' }, { status: 400 });
    }

    if (!VALID_EMERGENCY_STATUSES.includes(status)) {
      return NextResponse.json({
        success: false,
        error: `Invalid status '${status}'. Must be one of: ${VALID_EMERGENCY_STATUSES.join(', ')}`,
      }, { status: 400 });
    }

    // Server-side authentication check: Verify session via httpOnly cookie, NEVER trust client-supplied role in body
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('emergency_admin_session')?.value;
    const adminSession = adminToken ? getAdminSession(adminToken) : null;

    let timelineDetail = detail;
    if (!timelineDetail && adminSession) {
      timelineDetail = `Status updated to ${status.replace(/_/g, ' ')} by Admin (${adminSession.name})`;
    }

    const updatedReport = updateEmergencyStatus(id.trim(), status, timelineDetail);

    if (!updatedReport) {
      return NextResponse.json({ success: false, error: `Emergency report '${id}' not found.` }, { status: 404 });
    }

    return NextResponse.json({ success: true, report: updatedReport });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to update emergency status.' }, { status: 500 });
  }
}
