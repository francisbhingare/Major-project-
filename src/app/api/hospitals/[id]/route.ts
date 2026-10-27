import { NextResponse } from 'next/server';
import { getHospitalById } from '@/lib/db/store';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const hospital = getHospitalById(id);

    if (!hospital) {
      return NextResponse.json({ success: false, error: 'Hospital not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, hospital });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
