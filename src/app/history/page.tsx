'use client';

import React, { useState, useEffect } from 'react';
import { EmergencyCard } from '@/components/emergency/EmergencyCard';
import { EmergencyReport } from '@/types/emergency';
import { Clock, Search, RefreshCw, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function HistoryPage() {
  const [emergencies, setEmergencies] = useState<EmergencyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/emergency/history');
      const data = await res.json();
      if (data.success && data.emergencies) {
        setEmergencies(data.emergencies);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = emergencies.filter(
    (e) => filterSeverity === 'ALL' || e.severity === filterSeverity
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-purple-400" />
            <span>Emergency Report History</span>
          </h1>
          <p className="text-xs text-slate-400">
            Log of all submitted AI emergency reports, triage results, and hospital alert dispatches.
          </p>
        </div>

        <Link
          href="/report"
          className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>REPORT NEW EMERGENCY</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800 overflow-x-auto text-xs">
        {['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'].map((sev) => (
          <button
            key={sev}
            onClick={() => setFilterSeverity(sev)}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              filterSeverity === sev
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {sev}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
          <span>Loading history...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((report) => (
            <EmergencyCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}
