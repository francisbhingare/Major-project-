import { EmergencySeverity, EmergencyStatus } from '@/types/emergency';

export function formatReportId(num?: number): string {
  if (num) {
    return `ER-2026-${String(num).padStart(6, '0')}`;
  }
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `ER-2026-${randomNum}`;
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

export function getSeverityBgColor(severity: EmergencySeverity): string {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-red-600/20 text-red-500 border-red-500/40';
    case 'HIGH':
      return 'bg-orange-600/20 text-orange-400 border-orange-500/40';
    case 'MODERATE':
      return 'bg-amber-600/20 text-amber-400 border-amber-500/40';
    case 'LOW':
      return 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40';
    default:
      return 'bg-slate-700/40 text-slate-300 border-slate-600';
  }
}

export function getSeverityBadgeClass(severity: EmergencySeverity): string {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-red-600 text-white font-bold animate-pulse';
    case 'HIGH':
      return 'bg-orange-500 text-white font-semibold';
    case 'MODERATE':
      return 'bg-amber-500 text-slate-950 font-semibold';
    case 'LOW':
      return 'bg-emerald-600 text-white font-medium';
    default:
      return 'bg-slate-600 text-white';
  }
}

export function getStatusBadgeClass(status: EmergencyStatus): string {
  switch (status) {
    case 'NEW':
      return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
    case 'ANALYZING':
      return 'bg-purple-500/20 text-purple-400 border border-purple-500/30 animate-pulse';
    case 'HOSPITAL_RECOMMENDED':
      return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30';
    case 'REPORT_GENERATED':
      return 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30';
    case 'ALERT_SENT':
      return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    case 'ACKNOWLEDGED':
      return 'bg-teal-500/20 text-teal-400 border border-teal-500/30';
    case 'IN_RESPONSE':
      return 'bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold';
    case 'RESOLVED':
      return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    default:
      return 'bg-slate-700 text-slate-300';
  }
}
