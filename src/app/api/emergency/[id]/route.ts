import { NextResponse } from 'next/server';
import { getEmergencyById } from '@/lib/db/store';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'A valid emergency ID or report ID is required.' }, { status: 400 });
    }

    const report = getEmergencyById(id.trim());

    if (!report) {
      return NextResponse.json({ success: false, error: `Emergency report '${id}' not found.` }, { status: 404 });
    }

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
