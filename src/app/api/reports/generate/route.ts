import { NextResponse } from 'next/server';
import { generateEmergencyPDF } from '@/lib/services/pdfService';
import { getEmergencyById } from '@/lib/db/store';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id') || searchParams.get('report_id') || searchParams.get('emergency_id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing report id query parameter' }, { status: 400 });
    }

    const report = getEmergencyById(id);
    if (!report) {
      return NextResponse.json({ success: false, error: `Emergency report '${id}' not found` }, { status: 404 });
    }

    const pdfBuffer = generateEmergencyPDF(report);

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Emergency_Report_${report.report_id}.pdf"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'PDF generation failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { emergency_id, report } = body;

    let targetReport = report;
    if (emergency_id && !targetReport) {
      targetReport = getEmergencyById(emergency_id);
    }

    if (!targetReport) {
      return NextResponse.json({ success: false, error: 'Emergency report data missing' }, { status: 400 });
    }

    const pdfBuffer = generateEmergencyPDF(targetReport);

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Emergency_Report_${targetReport.report_id}.pdf"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'PDF generation failed' }, { status: 500 });
  }
}
