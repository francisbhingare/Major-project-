import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'red' | 'amber' | 'emerald' | 'blue' | 'purple';
}

export function StatCard({ title, value, subtitle, icon: Icon, color = 'blue' }: StatCardProps) {
  const colorStyles = {
    red: 'from-red-900/30 to-red-950/20 border-red-500/30 text-red-400 icon-bg-red-500/20',
    amber: 'from-amber-900/30 to-amber-950/20 border-amber-500/30 text-amber-400 icon-bg-amber-500/20',
    emerald: 'from-emerald-900/30 to-emerald-950/20 border-emerald-500/30 text-emerald-400 icon-bg-emerald-500/20',
    blue: 'from-blue-900/30 to-blue-950/20 border-blue-500/30 text-blue-400 icon-bg-blue-500/20',
    purple: 'from-purple-900/30 to-purple-950/20 border-purple-500/30 text-purple-400 icon-bg-purple-500/20',
  };

  const style = colorStyles[color];

  return (
    <div className={`bg-gradient-to-br ${style} border rounded-xl p-4 shadow-lg backdrop-blur-sm relative overflow-hidden`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center ${style.split(' ')[2]} border border-slate-700`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
