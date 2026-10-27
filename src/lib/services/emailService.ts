import { EmergencyReport } from '@/types/emergency';
import { generateEmergencyPDF } from './pdfService';
import { logEmailDispatch, updateEmergencyStatus } from '../db/store';

export async function sendHospitalEmergencyAlert(report: EmergencyReport): Promise<{
  success: boolean;
  recipient: string;
  timestamp: string;
  error?: string;
}> {
  const recipient = report.recommended_hospital?.emergency_email || 'er-trauma@apexhospital-demo.org';
  const subject = `URGENT EMERGENCY ALERT — [${report.severity}] — ${report.report_id}`;
  const timestamp = new Date().toISOString();

  try {
    const pdfBuffer = generateEmergencyPDF(report);
    const apiKey = process.env.EMAIL_API_KEY;

    // Real Resend API integration via native fetch (Zero external npm dependency)
    if (apiKey && process.env.DEMO_MODE !== 'true') {
      const fromEmail = process.env.EMAIL_FROM || 'alerts@resend.dev';

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 20px; border-radius: 10px;">
          <h2 style="color: #ef4444; margin-top: 0;">🚨 URGENT EMERGENCY ALERT</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #334155; font-weight: bold;">Report ID:</td><td style="padding: 8px; border-bottom: 1px solid #334155;">${report.report_id}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #334155; font-weight: bold;">Emergency Type:</td><td style="padding: 8px; border-bottom: 1px solid #334155;">${report.emergency_type}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #334155; font-weight: bold;">Severity Level:</td><td style="padding: 8px; border-bottom: 1px solid #334155; color: #ef4444; font-weight: bold;">${report.severity}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #334155; font-weight: bold;">People Affected:</td><td style="padding: 8px; border-bottom: 1px solid #334155;">${report.people_affected}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #334155; font-weight: bold;">GPS Location:</td><td style="padding: 8px; border-bottom: 1px solid #334155;">Lat: ${report.location.latitude}, Lon: ${report.location.longitude} (${report.location.address || 'GPS Detected'})</td></tr>
          </table>

          <h3 style="color: #38bdf8;">Incident Description:</h3>
          <p style="background: #1e293b; padding: 12px; border-radius: 6px;">"${report.description}"</p>

          ${report.voice ? `<h3 style="color: #c084fc;">Voice Transcription (Whisper):</h3><p style="background: #1e293b; padding: 12px; border-radius: 6px;">"${report.voice.original_transcription}"</p>` : ''}

          <h3 style="color: #f59e0b;">AI Assessment & Facilities Required:</h3>
          <p><strong>Required Facilities:</strong> ${report.ai_assessment?.required_facilities.join(', ')}</p>
          <p><strong>Reasoning:</strong> ${report.ai_assessment?.reasoning}</p>

          <div style="background-color: #7f1d1d; color: #fca5a5; padding: 10px; border-radius: 6px; font-size: 12px; margin-top: 20px;">
            ⚠️ <strong>DISCLAIMER:</strong> AI-generated assessment — verify with qualified emergency personnel. PDF report is attached.
          </div>
        </div>
      `;

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [recipient],
          subject,
          html: emailHtml,
          attachments: [
            {
              filename: `Emergency_Report_${report.report_id}.pdf`,
              content: pdfBuffer.toString('base64'),
            },
          ],
        }),
      });

      if (!resendRes.ok) {
        const errorText = await resendRes.text();
        throw new Error(errorText);
      }
    }

    // Log successful dispatch
    logEmailDispatch({
      emergency_id: report.id,
      recipient,
      subject,
      status: 'SUCCESS',
    });

    updateEmergencyStatus(
      report.id,
      'ALERT_SENT',
      `Emergency alert emailed to ${recipient}`
    );

    return {
      success: true,
      recipient,
      timestamp,
    };
  } catch (err: any) {
    logEmailDispatch({
      emergency_id: report.id,
      recipient,
      subject,
      status: 'FAILED',
      error: err.message,
    });

    return {
      success: false,
      recipient,
      timestamp,
      error: err.message || 'Email delivery failed',
    };
  }
}
