'use client';

import React, { useState } from 'react';
import { LocationData } from '@/types/emergency';
import { MapPin, Navigation, ShieldCheck, RefreshCw, AlertTriangle, Edit3 } from 'lucide-react';

interface GpsStatusCardProps {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onManualSelect?: (lat: number, lon: number, address?: string) => void;
}

export function GpsStatusCard({
  location,
  loading,
  error,
  onRefresh,
  onManualSelect,
}: GpsStatusCardProps) {
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualLat, setManualLat] = useState('18.5204');
  const [manualLon, setManualLon] = useState('73.8567');
  const [manualAddr, setManualAddr] = useState('');

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    if (!isNaN(lat) && !isNaN(lon) && onManualSelect) {
      onManualSelect(lat, lon, manualAddr || undefined);
      setShowManualForm(false);
    }
  };

  const getQualityBadge = (quality?: string) => {
    switch (quality) {
      case 'HIGH':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'LOW':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
            <Navigation className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              LOCATION TELEMETRY
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              {location ? (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  ● GPS LOCKED
                </span>
              ) : (
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  NO LOCATION CAPTURED
                </span>
              )}

              {location?.source && (
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                  location.source === 'DEVICE_GPS'
                    ? 'bg-blue-950 text-blue-300 border-blue-500/30'
                    : location.source === 'DEMO'
                    ? 'bg-purple-950 text-purple-300 border-purple-500/40'
                    : 'bg-amber-950 text-amber-300 border-amber-500/30'
                }`}>
                  {location.source === 'DEVICE_GPS' ? 'DEVICE GPS' : (location.source === 'DEMO' ? 'SIMULATED DEMO' : 'MANUAL INPUT')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{location ? 'REFRESH GPS' : 'CAPTURE GPS'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowManualForm(!showManualForm)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
            <span>MANUAL</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/60 border border-red-500/40 text-red-300 text-xs rounded-xl flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Captured Location Metrics */}
      {location && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Latitude</span>
            <span className="font-mono text-sm font-bold text-white">{location.latitude.toFixed(6)}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Longitude</span>
            <span className="font-mono text-sm font-bold text-white">{location.longitude.toFixed(6)}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Accuracy Radius</span>
            <span className="font-mono text-xs font-bold text-slate-200">±{location.accuracy || '?'} meters</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Location Quality</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded border inline-block mt-0.5 ${getQualityBadge(location.quality)}`}>
              QUALITY: {location.quality || 'UNKNOWN'}
            </span>
          </div>
        </div>
      )}

      {/* Manual Coordinates Override Form */}
      {showManualForm && (
        <form onSubmit={handleManualSubmit} className="bg-slate-950 border border-amber-500/30 p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Manual Location Entry (Fallback)
            </span>
            <span className="text-[10px] text-amber-300/80 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20">
              SOURCE: MANUAL
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase">Latitude</label>
              <input
                type="number"
                step="any"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                placeholder="18.5204"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase">Longitude</label>
              <input
                type="number"
                step="any"
                value={manualLon}
                onChange={(e) => setManualLon(e.target.value)}
                placeholder="73.8567"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase">Address / Landmark</label>
            <input
              type="text"
              value={manualAddr}
              onChange={(e) => setManualAddr(e.target.value)}
              placeholder="e.g. Main Road Junction near College Gate"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold text-xs py-2.5 rounded-lg transition-colors"
          >
            SET MANUAL LOCATION (SOURCE: MANUAL)
          </button>
        </form>
      )}
    </div>
  );
}
