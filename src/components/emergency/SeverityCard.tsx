import React from 'react';
import { AIAssessment } from '@/types/emergency';
import { getSeverityBadgeClass } from '@/lib/utils/formatters';
import { ShieldAlert, AlertTriangle, Activity, CheckCircle2, Info, HeartPulse } from 'lucide-react';

interface SeverityCardProps {
  assessment: AIAssessment;
}

export function SeverityCard({ assessment }: SeverityCardProps) {
  const isCritical = assessment.severity === 'CRITICAL';

  return (
    <div className={`rounded-2xl p-6 border shadow-xl backdrop-blur-md space-y-5 ${
      isCritical
        ? 'bg-gradient-to-br from-red-950/90 via-slate-900 to-red-950/40 border-red-500/60 shadow-red-950/40'
        : 'bg-slate-900/90 border-slate-800'
    }`}>
      {/* Header Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI TRIAGE SEVERITY</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-sm px-3 py-1 rounded-full ${getSeverityBadgeClass(assessment.severity)}`}>
                {assessment.severity}
              </span>
              <span className="text-xs font-bold text-slate-300">
                Confidence: <span className="text-emerald-400">{assessment.confidence}%</span>
              </span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 block uppercase">EMERGENCY CLASSIFICATION</span>
          <span className="text-sm font-bold text-white">{assessment.emergency_type}</span>
        </div>
      </div>

      {/* AI Reasoning */}
      <div className="space-y-1.5">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-amber-400" />
          <span>AI Assessment Reasoning</span>
        </h4>
        <p className="text-xs sm:text-sm text-slate-200 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 leading-relaxed">
          {assessment.reasoning}
        </p>
      </div>

      {/* Required Facilities Grid */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Required Clinical Facilities:
        </h4>
        <div className="flex flex-wrap gap-2">
          {assessment.required_facilities.map((facility, idx) => (
            <span
              key={idx}
              className="bg-slate-800 text-slate-200 text-xs font-medium px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{facility}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Recommended Immediate Response */}
      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
        <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
          <HeartPulse className="w-4 h-4 text-red-400" />
          <span>Recommended Response Protocol</span>
        </h4>
        <p className="text-xs text-slate-300">{assessment.recommended_response}</p>
      </div>

      {/* Immediate Safety Actions */}
      {assessment.immediate_safety_actions.length > 0 && (
        <div className="space-y-2 pt-1">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Immediate Safety Actions (First Responder Advice):
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {assessment.immediate_safety_actions.map((action, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-[11px] text-amber-200 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong>AI-generated assessment — verify with qualified emergency personnel.</strong>
        </span>
      </div>
    </div>
  );
}
