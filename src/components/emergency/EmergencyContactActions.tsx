'use client';

import React from 'react';
import { Hospital, LocationData } from '@/types/emergency';
import { PhoneCall, MapPin, Download, Share2, AlertTriangle, ExternalLink, ShieldAlert } from 'lucide-react';

interface EmergencyContactActionsProps {
  hospital?: Hospital;
  location?: LocationData | null;
  reportId?: string;
  isCritical?: boolean;
}

export function EmergencyContactActions({
  hospital,
  location,
  reportId,
  isCritical = false,
}: EmergencyContactActionsProps) {
  const emergencyPhone = process.env.NEXT_PUBLIC_EMERGENCY_PHONE || '112'; // Default regional emergency line (112 / 911 / 108)

  const mapsUrl = location
    ? `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`
    : hospital
    ? `https://www.google.com/maps/search/?api=1&query=${hospital.latitude},${hospital.longitude}`
    : '#';

  const handleShareReport = () => {
    if (navigator.share && reportId) {
      navigator.share({
        title: 'AI Emergency Response Report',
        text: `Emergency incident report #${reportId}. Immediate response required.`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      alert('Emergency report link copied to clipboard!');
    }
  };

  return (
    <div className={`rounded-2xl p-5 border space-y-4 shadow-xl ${
      isCritical
        ? 'bg-gradient-to-r from-red-950/90 via-slate-900 to-red-950/80 border-red-500/80 ring-2 ring-red-500/40'
        : 'bg-slate-900/90 border-slate-800'
    }`}>
      {isCritical && (
        <div className="flex items-center gap-2 text-red-400 font-extrabold text-sm uppercase tracking-wider pb-2 border-b border-red-500/30">
          <ShieldAlert className="w-5 h-5 animate-pulse shrink-0" />
          <span>🚨 CRITICAL EMERGENCY ACTIONS AVAILABLE</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Action 1: Call Emergency Line */}
        <a
          href={`tel:${emergencyPhone}`}
          className="bg-red-600 hover:bg-red-500 text-white font-black p-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] text-xs uppercase"
        >
          <PhoneCall className="w-4 h-4 animate-bounce" />
          <span>CALL EMERGENCY ({emergencyPhone})</span>
        </a>

        {/* Action 2: Call Hospital */}
        {hospital?.phone ? (
          <a
            href={`tel:${hospital.phone}`}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3.5 rounded-xl flex items-center justify-center gap-2 shadow transition-all hover:scale-[1.02] active:scale-[0.98] text-xs uppercase"
          >
            <PhoneCall className="w-4 h-4" />
            <span>CALL HOSPITAL</span>
          </a>
        ) : (
          <div className="bg-slate-950 border border-slate-800 text-slate-400 font-medium p-3.5 rounded-xl flex items-center justify-center gap-2 text-xs">
            <PhoneCall className="w-4 h-4 text-slate-500" />
            <span>Hospital Phone: Unavailable</span>
          </div>
        )}

        {/* Action 3: Open Location */}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold p-3.5 rounded-xl flex items-center justify-center gap-2 shadow transition-all hover:scale-[1.02] active:scale-[0.98] text-xs uppercase"
        >
          <ExternalLink className="w-4 h-4" />
          <span>OPEN IN GOOGLE MAPS</span>
        </a>

        {/* Action 4: Share / Download Report */}
        <button
          type="button"
          onClick={handleShareReport}
          className="bg-slate-800 hover:bg-slate-700 text-white font-bold p-3.5 rounded-xl flex items-center justify-center gap-2 border border-slate-700 shadow transition-all hover:scale-[1.02] active:scale-[0.98] text-xs uppercase"
        >
          <Share2 className="w-4 h-4 text-amber-400" />
          <span>SHARE EMERGENCY REPORT</span>
        </button>
      </div>
    </div>
  );
}
