import { NextResponse } from 'next/server';
import { getEmergencyById } from '@/lib/db/store';
import { generateEmergencyPDF } from '@/lib/services/pdfService';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const report = getEmergencyById(id);

    if (!report) {
      return NextResponse.json({ success: false, error: 'Emergency report not found' }, { status: 404 });
    }

    const pdfBuffer = generateEmergencyPDF(report);

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Emergency_Report_${report.report_id}.pdf"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
