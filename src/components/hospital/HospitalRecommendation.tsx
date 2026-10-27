import React from 'react';
import { Hospital } from '@/types/emergency';
import { Award, CheckCircle2, Navigation, Hospital as HospitalIcon, Sparkles, Globe, ShieldCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface HospitalRecommendationProps {
  hospital: Hospital;
  matchingReason?: string;
}

export function HospitalRecommendation({ hospital, matchingReason }: HospitalRecommendationProps) {
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`;

  return (
    <div className="bg-gradient-to-br from-amber-950/80 via-slate-900 to-slate-950 border-2 border-amber-500/80 rounded-2xl p-6 shadow-2xl space-y-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 text-slate-950 text-xs font-black px-4 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1 shadow-md">
        <Sparkles className="w-3.5 h-3.5" />
        <span>RECOMMENDED HOSPITAL</span>
      </div>

      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
          <HospitalIcon className="w-8 h-8" />
        </div>

        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xl font-extrabold text-white tracking-tight">{hospital.name}</h3>
            {hospital.is_demo ? (
              <span className="text-[9px] bg-purple-950 text-purple-300 font-bold px-2 py-0.5 rounded border border-purple-500/40 uppercase">
                DEMO FACILITY
              </span>
            ) : (
              <span className="text-[9px] bg-emerald-950 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/40 uppercase flex items-center gap-1">
                <Globe className="w-2.5 h-2.5" />
                Source: {hospital.source === 'GOOGLE_PLACES' ? 'Google Places' : 'OpenStreetMap'}
              </span>
            )}

            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
              hospital.verification_status === 'VERIFIED'
                ? 'bg-blue-950 text-blue-300 border-blue-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {hospital.verification_status === 'VERIFIED' ? 'Verified Registry' : 'Unverified Map Registry'}
            </span>
          </div>

          <p className="text-xs text-slate-300">{hospital.address || 'Address registered on map'}</p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <span className="text-xs font-bold text-amber-300">
              Straight-Line Distance: <strong className="text-white">{hospital.distanceKm !== undefined ? `${hospital.distanceKm} km` : '?'}</strong> <span className="text-[10px] text-slate-400 font-normal">(as-the-crow-flies)</span>
            </span>
            {hospital.suitabilityScore !== undefined && (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-500/30">
                Suitability Score: {hospital.suitabilityScore}/100
              </span>
            )}
          </div>
        </div>
      </div>

      {matchingReason && (
        <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-3.5 space-y-1">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
            Matching Rationale:
          </span>
          <p className="text-xs text-slate-200 leading-relaxed font-medium">"{matchingReason}"</p>
        </div>
      )}

      {/* Facilities checklist - ONLY render if verified or available in source */}
      {hospital.verification_status === 'VERIFIED' && hospital.capabilities ? (
        <div className="flex flex-wrap gap-2 text-xs">
          {hospital.capabilities.has_emergency_department && (
            <span className="bg-emerald-950/80 text-emerald-300 px-2.5 py-1 rounded-md border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Emergency Dept ✓
            </span>
          )}
          {hospital.capabilities.has_trauma_center && (
            <span className="bg-red-950/80 text-red-300 px-2.5 py-1 rounded-md border border-red-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-red-400" />
              Trauma Center ✓
            </span>
          )}
          {hospital.capabilities.has_icu && (
            <span className="bg-amber-950/80 text-amber-300 px-2.5 py-1 rounded-md border border-amber-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              ICU ✓
            </span>
          )}
          {hospital.capabilities.has_blood_bank && (
            <span className="bg-purple-950/80 text-purple-300 px-2.5 py-1 rounded-md border border-purple-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              Blood Bank ✓
            </span>
          )}
          {hospital.capabilities.has_ambulance && (
            <span className="bg-blue-950/80 text-blue-300 px-2.5 py-1 rounded-md border border-blue-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              Ambulance ✓
            </span>
          )}
        </div>
      ) : (
        <div className="text-[11px] text-slate-400 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>Detailed clinical department capabilities not explicitly verified on live map registry. Confirm emergency capacity upon dispatch.</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800">
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors shadow"
        >
          <Navigation className="w-4 h-4" />
          <span>OPEN GOOGLE MAPS NAVIGATION</span>
        </a>

        <span className="text-[11px] text-slate-400 font-mono">
          Driving navigation handled via Google Maps
        </span>
      </div>
    </div>
  );
}
