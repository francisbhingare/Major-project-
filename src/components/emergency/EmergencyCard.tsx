import React from 'react';
import Link from 'next/link';
import { EmergencyReport } from '@/types/emergency';
import { getSeverityBadgeClass, getStatusBadgeClass, formatDate } from '@/lib/utils/formatters';
import { Siren, MapPin, Users, Clock, Hospital, ArrowRight } from 'lucide-react';

interface EmergencyCardProps {
  report: EmergencyReport;
  onActionClick?: (status: string) => void;
}

export function EmergencyCard({ report }: EmergencyCardProps) {
  const isCritical = report.severity === 'CRITICAL';

  return (
    <div
      className={`rounded-2xl p-5 border shadow-lg transition-all space-y-4 ${
        isCritical
          ? 'bg-gradient-to-br from-red-950/80 via-slate-900 to-slate-950 border-red-500/50 hover:border-red-500 ring-1 ring-red-500/30'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <span className={`text-xs px-2.5 py-0.5 rounded-full ${getSeverityBadgeClass(report.severity)}`}>
            🚨 {report.severity}
          </span>
          <span className="font-extrabold text-white text-base tracking-tight">{report.emergency_type}</span>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono text-slate-400 block">{report.report_id}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded font-semibold inline-block mt-0.5 ${getStatusBadgeClass(report.status)}`}>
            {report.status}
          </span>
        </div>
      </div>

      {/* Description Snippet */}
      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
        "{report.description}"
      </p>

      {/* Meta Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-blue-400" />
          <span>{report.people_affected} Affected</span>
        </div>

        <div className="flex items-center gap-1.5 truncate">
          <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span className="truncate">{report.location.address || `${report.location.latitude.toFixed(3)}, ${report.location.longitude.toFixed(3)}`}</span>
        </div>

        <div className="flex items-center gap-1.5 truncate">
          <Hospital className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">{report.recommended_hospital?.name || 'Apex Trauma Center'}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-purple-400" />
          <span>{formatDate(report.created_at)}</span>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          AI Confidence: <strong className="text-emerald-400">{report.ai_confidence}%</strong>
        </span>

        <Link
          href={`/emergency/${report.id}`}
          className="bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white text-xs font-bold px-4 py-2 rounded-xl border border-red-500/40 transition-colors flex items-center gap-1"
        >
          <span>[VIEW EMERGENCY]</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
