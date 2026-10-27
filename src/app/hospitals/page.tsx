'use client';

import React, { useState, useEffect } from 'react';
import { HospitalCard } from '@/components/hospital/HospitalCard';
import { InteractiveMap } from '@/components/map/InteractiveMap';
import { GpsStatusCard } from '@/components/gps/GpsStatusCard';
import { Hospital } from '@/types/emergency';
import { Hospital as HospitalIcon, MapPin, Search, RefreshCw, AlertTriangle, Globe, Award, ShieldAlert } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';

export default function HospitalsPage() {
  const { location, loading: geoLoading, error: geoError, captureLocation, getRealLocation, setManualLocation } = useGeolocation({ autoCapture: true });
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [recommendedHospital, setRecommendedHospital] = useState<Hospital | undefined>(undefined);
  const [nearbyEmergencyHospitals, setNearbyEmergencyHospitals] = useState<Hospital[]>([]);
  const [closestFacilities, setClosestFacilities] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [apiError, setApiError] = useState<string | null>(null);
  const [sourceUsed, setSourceUsed] = useState<'GOOGLE_PLACES' | 'OPENSTREETMAP' | 'DEMO_DATA'>('OPENSTREETMAP');

  useEffect(() => {
    if (location) {
      fetchHospitalsForLocation(location);
    }
  }, [location, radiusKm]);

  const fetchHospitalsForLocation = async (loc: typeof location) => {
    if (!loc) return;
    setLoading(true);
    setApiError(null);
    try {
      const res = await fetch('/api/hospitals/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: loc.latitude,
          longitude: loc.longitude,
          emergency_type: 'General Medical Emergency',
          severity: 'HIGH',
          radius_km: radiusKm,
        }),
      });

      const data = await res.json();

      if (data.success && data.nearby_hospitals) {
        const all: Hospital[] = data.nearby_hospitals || [];
        setHospitals(all);
        setRecommendedHospital(data.recommended_hospital);
        setSourceUsed(data.source_used || 'OPENSTREETMAP');

        const emergencyOnly = (data.nearby_emergency_hospitals || data.nearby_hospitals).filter(
          (h: Hospital) => h.id !== data.recommended_hospital?.id && (h.emergency_capability === 'yes' || h.healthcare_type === 'hospital' || h.source === 'GOOGLE_PLACES')
        );
        const closestOnly = (data.closest_facilities || data.nearby_hospitals).filter(
          (h: Hospital) => h.id !== data.recommended_hospital?.id && !emergencyOnly.some((e: Hospital) => e.id === h.id)
        );

        setNearbyEmergencyHospitals(emergencyOnly);
        setClosestFacilities(closestOnly);
      } else {
        setHospitals([]);
        setRecommendedHospital(undefined);
        setNearbyEmergencyHospitals([]);
        setClosestFacilities([]);
        setApiError(data.error || 'No healthcare facilities found within search radius.');
      }
    } catch (err: any) {
      setApiError(`Network error: ${err.message}`);
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = async () => {
    if (location) {
      fetchHospitalsForLocation(location);
    } else {
      try {
        const loc = await getRealLocation();
        fetchHospitalsForLocation(loc);
      } catch (err: any) {
        setApiError('Real GPS coordinates are required. Please permit browser location access or enter manual coordinates.');
      }
    }
  };

  const filteredHospitals = hospitals.filter((h) =>
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (h.address && h.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <HospitalIcon className="w-6 h-6 text-emerald-400" />
            <span>Nearby Hospitals Discovery</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
              sourceUsed === 'GOOGLE_PLACES'
                ? 'bg-blue-950 text-blue-300 border-blue-500/40'
                : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
            }`}>
              {sourceUsed === 'GOOGLE_PLACES' ? '● GOOGLE PLACES' : '● OPENSTREETMAP'}
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Real GPS incident coordinates queried against {sourceUsed === 'GOOGLE_PLACES' ? 'official Google Places Nearby Search' : 'live OpenStreetMap Overpass servers'}. Zero mock data.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
          <Globe className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300 font-semibold">Search Radius:</span>
          <select
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 rounded text-white font-bold px-2 py-1 focus:ring-1 focus:ring-emerald-500"
          >
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={25}>25 km</option>
            <option value={50}>50 km</option>
          </select>
        </div>
      </div>

      {/* GPS Telemetry Inspector */}
      <GpsStatusCard
        location={location}
        loading={geoLoading}
        error={geoError}
        onRefresh={captureLocation}
        onManualSelect={setManualLocation}
      />

      {/* Overpass API Error Alert */}
      {apiError && (
        <div className="p-4 bg-amber-950/80 border border-amber-500/40 text-amber-200 text-xs sm:text-sm rounded-2xl space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>OPENSTREETMAP QUERY ISSUE</span>
          </div>
          <p className="text-xs text-amber-300/90 leading-relaxed">
            {apiError}
          </p>
          <button
            onClick={handleManualSearch}
            className="mt-1 bg-amber-500 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>RETRY SEARCH</span>
          </button>
        </div>
      )}

      {/* Interactive Map */}
      <InteractiveMap userLocation={location} hospitals={filteredHospitals} height="350px" />

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Filter hospitals by name or street..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <span className="text-xs text-slate-400">
          Facilities found within <strong>{radiusKm} km</strong>: <strong>{filteredHospitals.length}</strong>
        </span>
      </div>

      {/* 3-Tiered Hospital Lists */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
          <span>Searching OpenStreetMap (Overpass API) around current coordinates...</span>
        </div>
      ) : filteredHospitals.length > 0 ? (
        <div className="space-y-6">
          {/* SECTION A: RECOMMENDED */}
          {recommendedHospital && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">A. RECOMMENDED FACILITY</h3>
              </div>
              <HospitalCard hospital={recommendedHospital} isRecommended={true} />
            </div>
          )}

          {/* SECTION B: OTHER NEARBY EMERGENCY FACILITIES */}
          {nearbyEmergencyHospitals.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                B. OTHER NEARBY EMERGENCY FACILITIES ({nearbyEmergencyHospitals.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nearbyEmergencyHospitals.map((h) => (
                  <HospitalCard key={h.id} hospital={h} />
                ))}
              </div>
            </div>
          )}

          {/* SECTION C: CLOSEST FACILITIES */}
          {closestFacilities.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                C. CLOSEST FACILITIES (CAPABILITY UNVERIFIED) ({closestFacilities.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {closestFacilities.map((h) => (
                  <HospitalCard key={h.id} hospital={h} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
          <h3 className="text-base font-bold text-white uppercase">No verified nearby facilities found from the current data source.</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try expanding your search radius to 25 km or 50 km, or refresh your GPS coordinates.
          </p>
          <div className="flex justify-center gap-2 pt-2">
            {[10, 25, 50].map((r) => (
              <button
                key={r}
                onClick={() => setRadiusKm(r)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700"
              >
                SEARCH WITHIN {r} KM
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
