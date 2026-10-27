import React from 'react';
import { MultimodalObservation } from '@/types/emergency';
import { Eye, Mic, FileText, BrainCircuit, MapPin, CheckCircle2 } from 'lucide-react';

interface MultimodalObservationsCardProps {
  observations: MultimodalObservation[];
}

export function MultimodalObservationsCard({ observations }: MultimodalObservationsCardProps) {
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'VISION':
        return <Eye className="w-4 h-4 text-purple-400" />;
      case 'VOICE':
        return <Mic className="w-4 h-4 text-pink-400" />;
      case 'TEXT':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'LOCATION':
        return <MapPin className="w-4 h-4 text-red-400" />;
      case 'INFERENCE':
        return <BrainCircuit className="w-4 h-4 text-amber-400" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'VISION':
        return { category: 'OBSERVED', style: 'bg-purple-950 text-purple-300 border-purple-500/30' };
      case 'VOICE':
      case 'TEXT':
        return { category: 'REPORTED', style: 'bg-blue-950 text-blue-300 border-blue-500/30' };
      case 'LOCATION':
        return { category: 'OBSERVED', style: 'bg-red-950 text-red-300 border-red-500/30' };
      case 'INFERENCE':
        return { category: 'INFERRED', style: 'bg-amber-950 text-amber-300 border-amber-500/30' };
      default:
        return { category: 'REPORTED', style: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-amber-400" />
          <span>Multimodal Triage Telemetry</span>
        </h3>
        <span className="text-[10px] text-slate-400 font-mono">OBSERVED • REPORTED • INFERRED</span>
      </div>

      <div className="space-y-2.5">
        {observations.map((obs) => {
          const badge = getSourceBadge(obs.source);
          return (
            <div key={obs.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex items-start justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 bg-slate-900 rounded-lg border border-slate-800 shrink-0">
                  {getSourceIcon(obs.source)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${badge.style}`}>
                      {badge.category}
                    </span>
                    <span className="font-semibold text-slate-200">{obs.observation_type}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{obs.label}</p>
                </div>
              </div>

              <span className="text-[10px] font-mono text-slate-400 shrink-0 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                Confidence: <strong className="text-emerald-400">{obs.confidence}%</strong>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
