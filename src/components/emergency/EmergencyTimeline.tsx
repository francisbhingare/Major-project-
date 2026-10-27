import React from 'react';
import { TimelineEvent, EmergencyStatus } from '@/types/emergency';
import { CheckCircle2, Clock, AlertCircle, FileText, Mail, Activity, ShieldCheck } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatters';

interface TimelineProps {
  timeline: TimelineEvent[];
  currentStatus: EmergencyStatus;
}

export function EmergencyTimeline({ timeline, currentStatus }: TimelineProps) {
  const getStatusIcon = (status: EmergencyStatus) => {
    switch (status) {
      case 'NEW':
        return <Clock className="w-4 h-4 text-blue-400" />;
      case 'ANALYZING':
        return <Activity className="w-4 h-4 text-purple-400 animate-spin" />;
      case 'HOSPITAL_RECOMMENDED':
        return <CheckCircle2 className="w-4 h-4 text-cyan-400" />;
      case 'REPORT_GENERATED':
        return <FileText className="w-4 h-4 text-indigo-400" />;
      case 'ALERT_SENT':
        return <Mail className="w-4 h-4 text-amber-400" />;
      case 'ACKNOWLEDGED':
        return <CheckCircle2 className="w-4 h-4 text-teal-400" />;
      case 'IN_RESPONSE':
        return <Activity className="w-4 h-4 text-orange-400 animate-pulse" />;
      case 'RESOLVED':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
        <Clock className="w-4 h-4 text-red-500" />
        <span>Incident Life-Cycle Timeline</span>
      </h3>

      <div className="relative border-l-2 border-slate-800 ml-3 space-y-6">
        {timeline.map((event, idx) => {
          const isCurrent = event.status === currentStatus;
          return (
            <div key={idx} className="relative pl-6">
              <span className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full flex items-center justify-center bg-slate-950 border ${
                isCurrent ? 'border-red-500 ring-2 ring-red-500/40' : 'border-slate-700'
              }`}>
                {getStatusIcon(event.status)}
              </span>

              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isCurrent ? 'text-red-400' : 'text-slate-200'}`}>
                    {event.label}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatDate(event.timestamp)}
                  </span>
                </div>
                {event.details && (
                  <p className="text-xs text-slate-400 italic">{event.details}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
