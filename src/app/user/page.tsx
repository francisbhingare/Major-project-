'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { RapidEmergencyFlow } from '@/components/emergency/RapidEmergencyFlow';
import { EmergencyReport } from '@/types/emergency';
import {
  UserCheck,
  ShieldAlert,
  Clock,
  MapPin,
  FileText,
  LogOut,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Award,
  Download
} from 'lucide-react';
import Link from 'next/link';

export default function UserDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [userReports, setUserReports] = useState<EmergencyReport[]>([]);
  const [fetchingReports, setFetchingReports] = useState(true);

  // Route Guard: Require logged-in user
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch('/api/emergency/history');
        const data = await res.json();
        if (data.success && data.reports) {
          setUserReports(data.reports);
        }
      } catch (e) {
        // Fallback silently
      } finally {
        setFetchingReports(false);
      }
    };

    fetchReports();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl text-xs font-bold text-white shadow-xl">
          <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
          <span>Verifying User Authentication Session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Top Welcome User Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-black text-xl shadow-lg">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">{user.name}</h1>
                <span className="text-[10px] bg-blue-950 text-blue-300 font-extrabold px-2 py-0.5 rounded border border-blue-500/40 uppercase">
                  CITIZEN USER
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/history"
              className="bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-800 flex items-center gap-1.5 transition"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>My Incident History ({userReports.length})</span>
            </Link>

            <button
              onClick={logout}
              className="bg-red-950/60 hover:bg-red-900 text-red-300 text-xs font-bold px-3.5 py-2 rounded-xl border border-red-500/30 flex items-center gap-1.5 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Quick User Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs border-t border-slate-800/80">
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/60">
            <span className="text-slate-400 text-[10px] block uppercase font-bold">Account Role</span>
            <span className="text-emerald-400 font-bold capitalize">{user.role}</span>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/60">
            <span className="text-slate-400 text-[10px] block uppercase font-bold">GPS Location Lock</span>
            <span className="text-blue-400 font-bold">● Active</span>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/60">
            <span className="text-slate-400 text-[10px] block uppercase font-bold">Reports Submitted</span>
            <span className="text-white font-bold">{userReports.length} Incidents</span>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/60">
            <span className="text-slate-400 text-[10px] block uppercase font-bold">Emergency Hotline</span>
            <span className="text-red-400 font-bold">112 / 911 Ready</span>
          </div>
        </div>
      </div>

      {/* CORE EMERGENCY RESPONSE COMMAND ENGINE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
            <span>RAPID AI EMERGENCY INCIDENT COMMAND</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">LIVE USER DISPATCH TELEMETRY</span>
        </div>

        {/* Existing Rapid Emergency Flow Component preserving all features */}
        <RapidEmergencyFlow />
      </div>

      {/* RECENT USER INCIDENT REPORTS TABLE */}
      {userReports.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Your Recent Submitted Incidents ({userReports.length})</span>
            </h3>
            <Link href="/history" className="text-xs text-blue-400 hover:text-blue-300 underline font-bold">
              View All History →
            </Link>
          </div>

          <div className="space-y-3">
            {userReports.slice(0, 3).map((rep) => (
              <div
                key={rep.id}
                className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{rep.report_id}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${
                      rep.severity === 'CRITICAL' ? 'bg-red-950 text-red-300 border border-red-500/30' : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                    }`}>
                      {rep.severity}
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                      {rep.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-1">{rep.description}</p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    📍 {rep.location.address || `${rep.location.latitude}, ${rep.location.longitude}`} • {new Date(rep.created_at).toLocaleString()}
                  </p>
                </div>

                <Link
                  href={`/emergency/${rep.id}`}
                  className="bg-slate-900 hover:bg-slate-800 text-blue-400 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-800 shrink-0 transition"
                >
                  View Full Report →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
