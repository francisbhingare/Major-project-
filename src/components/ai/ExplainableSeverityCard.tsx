import React from 'react';
import { AIAssessment } from '@/types/emergency';
import { getSeverityBadgeClass } from '@/lib/utils/formatters';
import { ShieldAlert, Activity, CheckCircle2, AlertTriangle, HeartPulse, Info } from 'lucide-react';

interface ExplainableSeverityCardProps {
  assessment: AIAssessment;
}

export function ExplainableSeverityCard({ assessment }: ExplainableSeverityCardProps) {
  const isCritical = assessment.severity === 'CRITICAL';
  const breakdown = assessment.explainable_breakdown;

  return (
    <div className={`rounded-2xl p-6 border shadow-xl backdrop-blur-md space-y-5 ${
      isCritical
        ? 'bg-gradient-to-br from-red-950/90 via-slate-900 to-red-950/40 border-red-500/60 ring-1 ring-red-500/30'
        : 'bg-slate-900/90 border-slate-800'
    }`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              AI-ESTIMATED EMERGENCY PRIORITY
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs px-3 py-1 rounded-full font-extrabold ${getSeverityBadgeClass(assessment.severity)}`}>
                {assessment.severity}
              </span>
              {breakdown && (
                <span className="text-xs font-mono font-bold text-slate-300">
                  Triage Score: <strong className="text-amber-400">{breakdown.score} pts</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20 block font-bold">
            NOT A MEDICAL DIAGNOSIS
          </span>
          <span className="text-xs font-bold text-slate-300 mt-1 block">
            Confidence: <span className="text-emerald-400">{assessment.confidence}%</span>
          </span>
        </div>
      </div>

      {/* Transparent Triage Score Breakdown */}
      {breakdown && breakdown.breakdown.length > 0 && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            <span>Explainable Triage Scoring Factors:</span>
          </span>
          <div className="space-y-1.5 text-xs">
            {breakdown.breakdown.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-900/80 px-3 py-1.5 rounded border border-slate-800">
                <span className="text-slate-200 font-medium">• {item.factor}</span>
                <span className="font-mono font-bold text-red-400">+{item.points} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reasoning */}
      <div className="space-y-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Clinical Rationale:
        </span>
        <p className="text-xs text-slate-200 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 leading-relaxed">
          {assessment.reasoning}
        </p>
      </div>

      {/* Required Facilities */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Required Clinical Facilities:
        </span>
        <div className="flex flex-wrap gap-2">
          {assessment.required_facilities.map((fac, idx) => (
            <span key={idx} className="bg-slate-800 text-slate-200 text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{fac}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Safety Notice */}
      <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-[11px] text-amber-200 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong>AI-estimated emergency priority — not a medical diagnosis. Verify with qualified emergency personnel.</strong>
        </span>
      </div>
    </div>
  );
}
