import React from 'react';
import { AlertTriangle, PhoneCall } from 'lucide-react';

interface DisclaimerProps {
  compact?: boolean;
}

export function SafetyDisclaimerBanner({ compact = false }: DisclaimerProps) {
  if (compact) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 text-xs text-amber-200 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong>AI-assisted prototype:</strong> AI-generated assessment — verify with qualified emergency personnel.
        </span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-red-950/90 via-amber-950/80 to-slate-900 border-b border-red-500/30 text-slate-200 px-4 py-2 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2.5 w-2.5 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <span className="font-semibold text-red-400 tracking-wide uppercase text-xs">
            Emergency Notice:
          </span>
          <span className="text-slate-300">
            AI-generated assessment — verify with qualified emergency personnel. This is an AI prototype.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 bg-red-600/20 px-2.5 py-1 rounded border border-red-500/40 text-red-300 text-xs">
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Life Threatening? Call 112 / 911 Immediately</span>
        </div>
      </div>
    </div>
  );
}
