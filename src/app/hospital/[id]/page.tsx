import React from 'react';
import Link from 'next/link';
import { getHospitalById } from '@/lib/db/store';
import { InteractiveMap } from '@/components/map/InteractiveMap';
import { Hospital as HospitalIcon, MapPin, Phone, Mail, CheckCircle2, XCircle, Navigation, ArrowLeft, ShieldAlert } from 'lucide-react';

export default async function HospitalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const hospital = getHospitalById(id);

  if (!hospital) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Hospital Not Found</h2>
        <Link href="/hospitals" className="text-xs text-blue-400 underline">
          Back to Nearby Hospitals
        </Link>
      </div>
    );
  }

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`;

  return (
    <div className="space-y-6 pb-12">
      <Link href="/hospitals" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Nearby Hospitals</span>
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <HospitalIcon className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight">{hospital.name}</h1>
                {hospital.is_demo && (
                  <span className="text-[10px] bg-amber-950/80 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/30">
                    DEMO HOSPITAL
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>{hospital.address}</span>
              </p>
            </div>
          </div>

          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-2 transition-colors shadow"
          >
            <Navigation className="w-4 h-4" />
            <span>GET DIRECTIONS</span>
          </a>
        </div>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              Emergency Phone Contact
            </span>
            <p className="text-base font-bold text-white">{hospital.phone}</p>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-purple-400" />
              Emergency Alert Email
            </span>
            <p className="text-base font-bold text-white font-mono text-xs sm:text-sm">{hospital.emergency_email}</p>
          </div>
        </div>

        {/* Capability Checklist Grid */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Clinical Capabilities & Specialized Units:
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { label: 'Emergency Dept', available: hospital.capabilities.has_emergency_department },
              { label: 'Trauma Center', available: hospital.capabilities.has_trauma_center },
              { label: 'ICU Unit', available: hospital.capabilities.has_icu },
              { label: 'Blood Bank', available: hospital.capabilities.has_blood_bank },
              { label: 'Cardiology', available: hospital.capabilities.has_cardiology },
              { label: 'Neurology', available: hospital.capabilities.has_neurology },
              { label: 'Orthopedics', available: hospital.capabilities.has_orthopedics },
              { label: 'Burn Unit', available: hospital.capabilities.has_burn_unit },
              { label: 'Ambulance Fleet', available: hospital.capabilities.has_ambulance },
              { label: 'Operation Theatre', available: hospital.capabilities.has_operation_theatre },
            ].map((cap, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  cap.available
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 opacity-60'
                }`}
              >
                {cap.available ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <XCircle className="w-4 h-4 text-slate-500 shrink-0" />}
                <span>{cap.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Location Map */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Hospital Location Map</h3>
          <InteractiveMap hospitals={[hospital]} recommendedHospitalId={hospital.id} height="300px" />
        </div>
      </div>
    </div>
  );
}
