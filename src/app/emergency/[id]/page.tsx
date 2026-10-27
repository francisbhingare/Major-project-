'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { EmergencyReport } from '@/types/emergency';
import { SeverityCard } from '@/components/emergency/SeverityCard';
import { HospitalRecommendation } from '@/components/hospital/HospitalRecommendation';
import { EmergencyTimeline } from '@/components/emergency/EmergencyTimeline';
import { InteractiveMap } from '@/components/map/InteractiveMap';
import { formatDate } from '@/lib/utils/formatters';
import { 
  Siren, 
  FileText, 
  Mail, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  Volume2,
  MapPin,
  Clock,
  ShieldCheck
} from 'lucide-react';

export default function EmergencyDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [report, setReport] = useState<EmergencyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailSending, setEmailSending] = useState(false);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchReport();
  }, [id]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/emergency/${id}`);
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
      }
    } catch (err) {
      console.error('Failed to load emergency details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryEmail = async () => {
    if (!report) return;
    setEmailSending(true);
    setEmailMessage(null);

    try {
      const res = await fetch('/api/emergency/retry-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emergency_id: report.id }),
      });

      const data = await res.json();
      if (data.success) {
        setEmailMessage(`✓ Emergency report email successfully sent to ${data.recipient}`);
        fetchReport();
      } else {
        setEmailMessage(`Email delivery error: ${data.error || 'Failed to dispatch alert'}`);
      }
    } catch (err: any) {
      setEmailMessage(`Error: ${err.message}`);
    } finally {
      setEmailSending(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-red-500" />
        <span>Loading emergency incident report details...</span>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Emergency Report Not Found</h2>
        <Link href="/history" className="text-xs text-blue-400 underline">
          View Emergency History
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link href="/history" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Emergency History</span>
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={`/api/reports/${report.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow"
          >
            <Download className="w-4 h-4" />
            <span>[GENERATE & DOWNLOAD PDF REPORT]</span>
          </a>
        </div>
      </div>

      {/* Title & Metadata Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold">
              {report.report_id}
            </span>
            <h1 className="text-2xl font-black text-white">{report.emergency_type}</h1>
          </div>
          <p className="text-xs text-slate-400">
            Reported on {formatDate(report.created_at)} • {report.people_affected} person(s) affected
          </p>
        </div>

        {/* Email Status Indicator */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="font-bold text-slate-300 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              Hospital Alert Delivery:
            </span>
            {report.email_status?.sent ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> SENT
              </span>
            ) : (
              <button
                onClick={handleRetryEmail}
                disabled={emailSending}
                className="text-amber-400 underline font-bold hover:text-amber-300"
              >
                {emailSending ? 'Sending...' : '[RETRY EMAIL]'}
              </button>
            )}
          </div>
          {report.email_status?.recipient && (
            <p className="text-[11px] text-slate-400 font-mono">{report.email_status.recipient}</p>
          )}
        </div>
      </div>

      {emailMessage && (
        <div className="p-3.5 bg-slate-900 border border-slate-800 text-xs rounded-xl text-slate-200">
          {emailMessage}
        </div>
      )}

      {/* Main Grid: AI Assessment & Hospital Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: AI Severity & Description */}
        <div className="lg:col-span-7 space-y-6">
          {report.ai_assessment && <SeverityCard assessment={report.ai_assessment} />}

          {/* Description & Voice Transcription Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Emergency Description</span>
            </h3>
            <p className="text-sm text-slate-200 bg-slate-950 p-4 rounded-xl border border-slate-800 leading-relaxed">
              "{report.description}"
            </p>

            {report.voice && (
              <div className="pt-2 space-y-2">
                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  <span>Voice Note Transcription (Whisper)</span>
                </h4>
                <p className="text-xs text-purple-200 bg-purple-950/40 p-3 rounded-xl border border-purple-500/30 italic">
                  "{report.voice.original_transcription}"
                </p>
              </div>
            )}
          </div>

          {/* Location Map */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500" />
              <span>Captured Incident GPS Map</span>
            </h3>
            <InteractiveMap
              userLocation={report.location}
              hospitals={report.recommended_hospital ? [report.recommended_hospital] : []}
              recommendedHospitalId={report.recommended_hospital_id}
              height="300px"
            />
          </div>
        </div>

        {/* Right Column: Matched Hospital & Timeline */}
        <div className="lg:col-span-5 space-y-6">
          {report.recommended_hospital && (
            <HospitalRecommendation
              hospital={report.recommended_hospital}
              matchingReason="Selected based on emergency severity, required trauma/ICU capabilities, and geographic proximity."
            />
          )}

          <EmergencyTimeline timeline={report.timeline} currentStatus={report.status} />
        </div>
      </div>
    </div>
  );
}
