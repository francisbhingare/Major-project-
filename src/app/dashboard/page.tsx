'use client';

import React, { useState, useEffect } from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { InteractiveMap } from '@/components/map/InteractiveMap';
import { EmergencyReport, EmergencyStatus } from '@/types/emergency';
import { getSeverityBadgeClass, getStatusBadgeClass, formatDate } from '@/lib/utils/formatters';
import { 
  Activity, 
  Siren, 
  Hospital, 
  Mail, 
  CheckCircle2, 
  ShieldAlert, 
  RefreshCw, 
  MapPin, 
  Users, 
  Clock,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [emergencies, setEmergencies] = useState<EmergencyReport[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/emergencies');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setEmergencies(data.emergencies);
        setHospitals(data.hospitals);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: EmergencyStatus, detail: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/emergency/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, detail }),
      });

      const data = await res.json();
      if (data.success) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Status update failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Sort CRITICAL emergencies first
  const sortedEmergencies = [...emergencies].sort((a, b) => {
    if (a.severity === 'CRITICAL' && b.severity !== 'CRITICAL') return -1;
    if (a.severity !== 'CRITICAL' && b.severity === 'CRITICAL') return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-red-500" />
              <span>Hospital & Responder Command Center</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Real-time incident queue, live Leaflet map tracking, and emergency alert response actions.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>REFRESH FEED</span>
        </button>
      </div>

      {/* Metric Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard title="Active" value={stats?.active ?? 0} icon={Siren} color="red" />
        <StatCard title="Critical" value={stats?.critical ?? 0} icon={ShieldAlert} color="red" />
        <StatCard title="High Severity" value={stats?.high ?? 0} icon={Activity} color="amber" />
        <StatCard title="Alerts Sent" value={stats?.reports_sent ?? 0} icon={Mail} color="emerald" />
        <StatCard title="Awaiting" value={stats?.awaiting_response ?? 0} icon={Clock} color="purple" />
        <StatCard title="Resolved" value={stats?.resolved ?? 0} icon={ShieldCheck} color="emerald" />
      </div>

      {/* Main Command Grid: Live Map & Alert Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Emergency Alerts List (Sorted CRITICAL first) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Siren className="w-4 h-4 text-red-500" />
              <span>Emergency Alerts Queue (Critical Priority First)</span>
            </h2>
            <span className="text-xs text-slate-400">Total: {sortedEmergencies.length}</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-red-500" />
              <span>Loading live emergency queue...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedEmergencies.map((rep) => {
                const isCrit = rep.severity === 'CRITICAL';
                return (
                  <div
                    key={rep.id}
                    className={`rounded-2xl p-5 border shadow-xl space-y-4 transition-all ${
                      isCrit
                        ? 'bg-gradient-to-br from-red-950/80 via-slate-900 to-slate-950 border-red-500/60 ring-1 ring-red-500/40'
                        : 'bg-slate-900/80 border-slate-800'
                    }`}
                  >
                    {/* Incident Header */}
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2.5 py-0.5 rounded-full ${getSeverityBadgeClass(rep.severity)}`}>
                            {rep.severity}
                          </span>
                          <h3 className="text-base font-bold text-white tracking-tight">{rep.emergency_type}</h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 font-mono">{rep.report_id} • {formatDate(rep.created_at)}</p>
                      </div>

                      <span className={`text-xs px-2.5 py-1 rounded-md font-bold ${getStatusBadgeClass(rep.status)}`}>
                        {rep.status}
                      </span>
                    </div>

                    {/* Incident Description */}
                    <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/70 p-3 rounded-xl border border-slate-800 font-medium">
                      "{rep.description}"
                    </p>

                    {/* Details Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-400" />
                        <span>{rep.people_affected} Affected</span>
                      </div>

                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span className="truncate">{rep.location.address || 'GPS Captured'}</span>
                      </div>

                      <div className="flex items-center gap-1.5 truncate">
                        <Hospital className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{rep.recommended_hospital?.name || 'Apex Trauma Center'}</span>
                      </div>
                    </div>

                    {/* RESPONDER ACTION BUTTONS GROUP */}
                    <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {rep.status !== 'ACKNOWLEDGED' && rep.status !== 'IN_RESPONSE' && rep.status !== 'RESOLVED' && (
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(rep.id, 'ACKNOWLEDGED', 'Hospital staff acknowledged alert')}
                            disabled={actionLoading === rep.id}
                            className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow"
                          >
                            [ACKNOWLEDGE]
                          </button>
                        )}

                        {rep.status !== 'IN_RESPONSE' && rep.status !== 'RESOLVED' && (
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(rep.id, 'IN_RESPONSE', 'Ambulance dispatched & response active')}
                            disabled={actionLoading === rep.id}
                            className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow"
                          >
                            [START RESPONSE]
                          </button>
                        )}

                        {rep.status !== 'RESOLVED' && (
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(rep.id, 'RESOLVED', 'Emergency resolved & patient handed to trauma care')}
                            disabled={actionLoading === rep.id}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow"
                          >
                            [MARK RESOLVED]
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/emergency/${rep.id}`}
                          className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700"
                        >
                          [VIEW REPORT]
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Live Emergency Map */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-400" />
              <span>Live Emergency Command Map</span>
            </h2>
          </div>

          <InteractiveMap
            userLocation={sortedEmergencies[0]?.location || null}
            hospitals={hospitals}
            height="550px"
          />
        </div>
      </div>
    </div>
  );
}
