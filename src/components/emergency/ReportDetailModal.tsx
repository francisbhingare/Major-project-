'use client';

import React, { useState } from 'react';
import { EmergencyReport } from '@/types/emergency';
import {
  X,
  FileText,
  Download,
  Printer,
  ShieldAlert,
  MapPin,
  Hospital as HospitalIcon,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Sparkles,
  Eye,
  Mic,
  Layers,
  Phone
} from 'lucide-react';

interface ReportDetailModalProps {
  report: EmergencyReport | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReportDetailModal({ report, isOpen, onClose }: ReportDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'31_FIELDS' | 'MULTIMODAL_EVIDENCE' | 'LOCATION_HOSPITAL'>('31_FIELDS');

  if (!isOpen || !report) return null;

  const ai = report.ai_assessment;
  const detailed = report.detailed_analysis || ai?.detailed_analysis;
  const cad = report.accident_detection || ai?.accident_detection;
  const hosp = report.recommended_hospital;
  const loc = report.location;

  const handleDownloadPDF = () => {
    window.open(`/api/reports/generate?id=${report.id}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-500/40 flex items-center justify-center text-red-400 font-black">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white font-mono">
                  {report.report_id}
                </h2>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${
                  report.severity === 'CRITICAL' ? 'bg-red-950 text-red-300 border-red-500/40' : 'bg-amber-950 text-amber-300 border-amber-500/40'
                }`}>
                  {report.severity}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Created: {new Date(report.created_at).toLocaleString()} • AI Confidence: {report.ai_confidence}%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition shadow"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('31_FIELDS')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition ${
              activeTab === '31_FIELDS'
                ? 'border-emerald-500 text-emerald-400 font-black'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>31-Field AI Incident Analysis</span>
          </button>
          <button
            onClick={() => setActiveTab('MULTIMODAL_EVIDENCE')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'MULTIMODAL_EVIDENCE'
                ? 'border-emerald-500 text-emerald-400 font-black'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Computer Vision & Evidence</span>
          </button>
          <button
            onClick={() => setActiveTab('LOCATION_HOSPITAL')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition ${
              activeTab === 'LOCATION_HOSPITAL'
                ? 'border-emerald-500 text-emerald-400 font-black'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HospitalIcon className="w-4 h-4" />
            <span>GPS & Hospital Match</span>
          </button>
        </div>

        {/* MODAL CONTENT BODY */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {activeTab === '31_FIELDS' && (
            <div className="space-y-5">
              {/* Overview Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Primary Category</span>
                  <span className="text-white font-bold">{detailed?.primary_incident_category || report.emergency_type}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Triage Priority Score</span>
                  <span className="text-amber-400 font-bold">Priority {detailed?.triage_priority_score || 1}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Severity Score</span>
                  <span className="text-red-400 font-bold">{detailed?.severity_score || 88}/100</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">People Affected</span>
                  <span className="text-emerald-400 font-bold">{report.people_affected} person(s)</span>
                </div>
              </div>

              {/* Red Flags Card */}
              <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-2xl space-y-2">
                <h4 className="font-extrabold text-red-400 uppercase tracking-wider flex items-center gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Red Flags & Vital Threats Detected</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-red-200">
                  {(detailed?.red_flags_detected || [ai?.reasoning || 'High-severity emergency indicators']).map((rf, i) => (
                    <div key={i} className="flex items-center gap-2 bg-red-950/60 p-2 rounded-lg border border-red-500/20">
                      <span className="text-red-400 shrink-0">⚠️</span>
                      <span>{rf}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clinical Reasoning */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="font-extrabold text-slate-300 uppercase tracking-wider text-xs">
                  AI Clinical Triage Summary
                </h4>
                <p className="text-slate-300 leading-relaxed font-sans text-xs">
                  {detailed?.clinical_reasoning_summary || ai?.reasoning}
                </p>
              </div>

              {/* Required Facilities & First-Aid Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <h4 className="font-extrabold text-amber-400 uppercase tracking-wider text-xs">
                    Required Hospital Capabilities
                  </h4>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(detailed?.required_hospital_capabilities || ai?.required_facilities || ['Emergency Department', 'ICU']).map((cap, i) => (
                      <span key={i} className="bg-amber-950/80 text-amber-300 border border-amber-500/30 font-extrabold px-2.5 py-1 rounded-lg">
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <h4 className="font-extrabold text-emerald-400 uppercase tracking-wider text-xs">
                    Recommended First-Aid Steps
                  </h4>
                  <ul className="space-y-1.5 text-slate-300">
                    {(detailed?.immediate_first_aid_steps || ai?.immediate_safety_actions || ['Do not move patient', 'Keep airway clear']).map((step, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="font-bold text-emerald-400">{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Uncertainties & Missing Data */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="font-extrabold text-slate-400 uppercase tracking-wider text-xs">
                  Key Uncertainties & Missing Telemetry
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-400">
                  <div>
                    <span className="font-bold text-slate-300 block mb-1">Unverified Factors:</span>
                    <ul className="list-disc list-inside space-y-1">
                      {detailed?.key_uncertainties?.map((u, i) => (
                        <li key={i}>{u}</li>
                      )) || <li>On-scene vital signs unconfirmed</li>}
                    </ul>
                  </div>
                  <div>
                    <span className="font-bold text-slate-300 block mb-1">Missing On-Scene Data:</span>
                    <ul className="list-disc list-inside space-y-1">
                      {detailed?.missing_critical_data?.map((m, i) => (
                        <li key={i}>{m}</li>
                      )) || <li>AVPU / GCS Assessment</li>}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'MULTIMODAL_EVIDENCE' && (
            <div className="space-y-5">
              {/* Computer Vision Card */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-amber-400 uppercase tracking-wider text-xs flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    <span>Computer Vision Detection (CAD / YOLOv8)</span>
                  </h4>
                  <span className="text-[10px] font-mono bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                    CONFIDENCE: {Math.round((cad?.confidence || 0.9) * 100)}%
                  </span>
                </div>

                {cad ? (
                  <div className="space-y-3">
                    <p className="text-white font-bold">
                      Incident Type: <span className="text-amber-300">{cad.incident_type}</span>
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-500 text-[10px] block">People</span>
                        <span className="text-white font-black">{cad.object_counts?.people || 0}</span>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-500 text-[10px] block">Vehicles</span>
                        <span className="text-white font-black">{cad.object_counts?.vehicles || 0}</span>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-500 text-[10px] block">Damaged Vehicles</span>
                        <span className="text-red-400 font-black">{cad.object_counts?.damaged_vehicles || 0}</span>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-500 text-[10px] block">Smoke / Fire</span>
                        <span className="text-amber-400 font-black">{(cad.object_counts?.smoke_fire || 0) > 0 ? 'Detected ✓' : 'None'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 italic">No image telemetry submitted with this report.</p>
                )}
              </div>

              {/* Text & Voice Audio Transcript */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <h4 className="font-extrabold text-slate-300 uppercase tracking-wider text-xs">
                    User Text Description
                  </h4>
                  <p className="text-slate-300 italic bg-slate-900 p-3 rounded-xl border border-slate-800">
                    "{report.description}"
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <h4 className="font-extrabold text-slate-300 uppercase tracking-wider text-xs flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-red-400" />
                    <span>Whisper Voice STT Transcript</span>
                  </h4>
                  {report.voice ? (
                    <p className="text-slate-300 italic bg-slate-900 p-3 rounded-xl border border-slate-800">
                      "{report.voice.original_transcription}"
                    </p>
                  ) : (
                    <p className="text-slate-500 italic p-3">No voice recording attached.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'LOCATION_HOSPITAL' && (
            <div className="space-y-5">
              {/* Location Card */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-emerald-400 uppercase tracking-wider text-xs flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>GPS Telemetry & Geolocation</span>
                  </h4>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg inline-flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Google Maps</span>
                  </a>
                </div>

                <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Latitude</span>
                    <span className="text-white font-bold">{loc.latitude.toFixed(6)}</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Longitude</span>
                    <span className="text-white font-bold">{loc.longitude.toFixed(6)}</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Accuracy</span>
                    <span className="text-emerald-400 font-bold">±{loc.accuracy || 10} m</span>
                  </div>
                </div>
              </div>

              {/* Matched Hospital Card */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="font-extrabold text-amber-400 uppercase tracking-wider text-xs flex items-center gap-2">
                  <HospitalIcon className="w-4 h-4" />
                  <span>Matched Emergency Healthcare Facility</span>
                </h4>

                {hosp ? (
                  <div className="space-y-2 text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-black text-white">{hosp.name}</span>
                      <span className="text-xs font-mono font-bold text-amber-300">{hosp.distanceKm} km away</span>
                    </div>
                    <p className="text-slate-400">{hosp.address}</p>
                    <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
                      <span className="bg-slate-900 text-emerald-300 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        {hosp.phone || 'N/A'}
                      </span>
                      <span className="bg-slate-900 text-amber-300 px-2.5 py-1 rounded-lg border border-slate-800">
                        {hosp.emergency_email || 'N/A'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 italic">Hospital matching in progress...</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handlePrint}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg transition transform active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD OFFICIAL PDF REPORT</span>
          </button>
        </div>

      </div>
    </div>
  );
}
