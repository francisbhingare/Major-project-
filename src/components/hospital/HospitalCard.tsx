import React from 'react';
import { Hospital } from '@/types/emergency';
import { MapPin, Phone, Globe, ExternalLink, CheckCircle2, Award, AlertCircle } from 'lucide-react';

interface HospitalCardProps {
  hospital: Hospital;
  isRecommended?: boolean;
}

export function HospitalCard({ hospital, isRecommended = false }: HospitalCardProps) {
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${hospital.latitude},${hospital.longitude}`;

  return (
    <div
      className={`rounded-2xl p-5 border transition-all space-y-4 shadow-lg ${
        isRecommended
          ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border-amber-500/60 ring-2 ring-amber-500/30'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Top Header: Title, Source & Distance */}
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-white tracking-tight">{hospital.name}</h3>
            {hospital.is_demo ? (
              <span className="text-[9px] bg-purple-950 text-purple-300 font-bold px-1.5 py-0.5 rounded border border-purple-500/40 uppercase">
                DEMO HOSPITAL
              </span>
            ) : (
              <span className="text-[9px] bg-emerald-950 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30 uppercase flex items-center gap-1">
                <Globe className="w-2.5 h-2.5" />
                Data source: {hospital.source === 'GOOGLE_PLACES' ? 'Google Places' : 'OpenStreetMap'}
              </span>
            )}
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
              hospital.verification_status === 'VERIFIED'
                ? 'bg-blue-950 text-blue-300 border-blue-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {hospital.verification_status === 'VERIFIED' ? 'Verified Registry' : 'Unverified Map Data'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-start gap-1">
            <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
            <span>{hospital.address || 'Address verified on map'}</span>
          </p>
        </div>

        <div className="text-right">
          {hospital.distanceKm !== undefined && (
            <span className="text-sm font-extrabold text-blue-400 block" title="Great-circle geodesic distance">
              {hospital.distanceKm} km straight-line
            </span>
          )}
          {hospital.suitabilityScore !== undefined && (
            <div className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 text-xs font-bold px-2 py-0.5 rounded border border-amber-500/30 mt-1">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Suitability: {hospital.suitabilityScore}/100</span>
            </div>
          )}
        </div>
      </div>

      {/* Healthcare Attributes & Capability Info */}
      <div className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          <div>
            <span className="text-slate-400 text-[11px] block uppercase font-semibold">Facility Type:</span>
            <span className="text-slate-200 font-medium capitalize">
              {hospital.healthcare_type || 'Hospital / Healthcare'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 text-[11px] block uppercase font-semibold">Emergency Capability:</span>
            <span className={`font-medium ${hospital.emergency_capability === 'yes' ? 'text-emerald-400' : 'text-slate-400'}`}>
              {hospital.emergency_capability === 'yes' ? 'Emergency Dept Available ✓' : (hospital.emergency_capability || 'Not available')}
            </span>
          </div>
        </div>

        {hospital.verification_status === 'VERIFIED' && hospital.capabilities ? (
          <div className="flex flex-wrap gap-2 text-xs pt-1">
            {hospital.capabilities.has_emergency_department && (
              <span className="bg-emerald-950/60 text-emerald-300 px-2.5 py-1 rounded-md border border-emerald-500/30 font-medium">
                Emergency Dept ✓
              </span>
            )}
            {hospital.capabilities.has_trauma_center && (
              <span className="bg-red-950/60 text-red-300 px-2.5 py-1 rounded-md border border-red-500/30 font-medium">
                Trauma Center ✓
              </span>
            )}
            {hospital.capabilities.has_icu && (
              <span className="bg-amber-950/60 text-amber-300 px-2.5 py-1 rounded-md border border-amber-500/30 font-medium">
                ICU ✓
              </span>
            )}
          </div>
        ) : null}
      </div>

      {/* Contacts & Google Maps Navigation Deep-Link */}
      <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 text-slate-300">
          {hospital.phone ? (
            <a href={`tel:${hospital.phone}`} className="flex items-center gap-1 hover:text-white underline">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>{hospital.phone}</span>
            </a>
          ) : (
            <span className="text-slate-400 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>Phone: Not available</span>
            </span>
          )}

          {hospital.website && (
            <a href={hospital.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white underline">
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              <span>Website</span>
            </a>
          )}
        </div>

        <div className="flex items-center gap-2">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-colors shadow text-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>OPEN IN GOOGLE MAPS</span>
          </a>
        </div>
      </div>
    </div>
  );
}
