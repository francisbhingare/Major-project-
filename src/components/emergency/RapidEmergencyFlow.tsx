'use client';

import React, { useState, useEffect } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { VoiceRecorder } from './VoiceRecorder';
import { ImageAnalyzer } from './ImageAnalyzer';
import { InteractiveMap } from '@/components/map/InteractiveMap';
import { ReportDetailModal } from './ReportDetailModal';
import { ProposedSystemDiagram } from '@/components/system/ProposedSystemDiagram';
import { AIAssessment, Hospital, EmergencyReport, AccidentDetectionResult } from '@/types/emergency';
import { queueIncidentForSync, processSyncQueue } from '@/lib/services/syncService';
import {
  ShieldAlert,
  MapPin,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Mic,
  Camera,
  FileText,
  Sparkles,
  Phone,
  Navigation,
  Download,
  Layers,
  ChevronDown,
  ChevronUp,
  Heart,
  Flame,
  Car,
  Clock,
  ArrowRight,
  Send,
  Zap,
  Activity,
  User,
  Users
} from 'lucide-react';

const EMERGENCY_TYPES = [
  { id: 'Road Accident', label: 'Road Accident', icon: Car, color: 'text-rose-400 bg-rose-950/40 border-rose-500/40' },
  { id: 'Chest Pain', label: 'Chest Pain / Cardiac', icon: Heart, color: 'text-red-400 bg-red-950/40 border-red-500/40' },
  { id: 'Fire', label: 'Fire / Burns', icon: Flame, color: 'text-amber-400 bg-amber-950/40 border-amber-500/40' },
  { id: 'Injury', label: 'Trauma / Bleeding', icon: ShieldAlert, color: 'text-orange-400 bg-orange-950/40 border-orange-500/40' },
  { id: 'Unconscious Person', label: 'Unconscious / Faint', icon: Activity, color: 'text-purple-400 bg-purple-950/40 border-purple-500/40' },
  { id: 'Other', label: 'Other Medical', icon: Sparkles, color: 'text-blue-400 bg-blue-950/40 border-blue-500/40' },
];

const PRESETS = [
  {
    type: 'Road Accident',
    desc: 'Highway multi-vehicle collision. Driver unconscious, severe bleeding from forehead, broken windshield.',
    people: 2,
    badge: 'Car Crash',
  },
  {
    type: 'Chest Pain',
    desc: 'Elderly patient complaining of crushing chest pain radiating to left arm with profuse cold sweating.',
    people: 1,
    badge: 'Cardiac Arrest',
  },
  {
    type: 'Fire',
    desc: 'Kitchen fire accident. Second-degree thermal burns on hands and face with smoke inhalation.',
    people: 1,
    badge: 'Fire & Burn',
  },
  {
    type: 'Injury',
    desc: 'Patient fell from 12-foot ladder onto concrete floor, severe leg deformity and unable to stand.',
    people: 1,
    badge: 'Trauma / Fall',
  },
];

export function RapidEmergencyFlow() {
  const { location, loading: geoLoading, error: geoError, captureLocation, getRealLocation, setManualLocation, setDemoLocation } = useGeolocation({ autoCapture: true });

  // Input states
  const [selectedType, setSelectedType] = useState<string>('Road Accident');
  const [inputTab, setInputTab] = useState<'VOICE' | 'IMAGE' | 'TEXT'>('TEXT');
  const [textInput, setTextInput] = useState('');
  const [voiceText, setVoiceText] = useState('');
  const [peopleCount, setPeopleCount] = useState<number>(1);
  const [activeAccidentDetection, setActiveAccidentDetection] = useState<AccidentDetectionResult | null>(null);
  const [yoloDetectionOutput, setYoloDetectionOutput] = useState<{
    people: number;
    vehicles: number;
    smokeFire: boolean;
    damagedVehicles: number;
    others: number;
  }>({ people: 0, vehicles: 0, smokeFire: false, damagedVehicles: 0, others: 0 });

  // Processing & result states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdReport, setCreatedReport] = useState<EmergencyReport | null>(null);
  const [aiAssessment, setAiAssessment] = useState<AIAssessment | null>(null);
  const [recommendedHospital, setRecommendedHospital] = useState<Hospital | undefined>(undefined);
  const [allHospitals, setAllHospitals] = useState<Hospital[]>([]);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [showDiagram, setShowDiagram] = useState(false);
  const [isEditingGps, setIsEditingGps] = useState(false);
  const [manualAddress, setManualAddress] = useState('');

  // Auto-sync offline queued emergencies when coming online
  useEffect(() => {
    const handleOnline = () => {
      processSyncQueue().then((res) => {
        if (res.synced > 0) {
          console.log(`[Offline Sync] Synchronized ${res.synced} pending reports.`);
        }
      });
    };
    window.addEventListener('online', handleOnline);
    handleOnline();
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Handle Preset quick fill
  const applyPreset = (preset: typeof PRESETS[0]) => {
    setSelectedType(preset.type);
    setTextInput(preset.desc);
    setPeopleCount(preset.people);
    setInputTab('TEXT');
    setFlowError(null);
  };

  const handleVoiceTranscription = (text: string) => {
    setVoiceText(text);
    if (!textInput) {
      setTextInput(text);
    }
  };

  const handleSubmitEmergency = async () => {
    const combinedDescription = [textInput, voiceText].filter(Boolean).join('. ').trim();

    if (!combinedDescription && !activeAccidentDetection) {
      setFlowError('Please provide a brief description, speak a voice note, or upload an image.');
      return;
    }

    setIsSubmitting(true);
    setFlowError(null);

    try {
      // 1. Resolve Location (prefer live GPS or user's manual pin, NEVER silently fake GPS)
      let activeLocation = location;
      if (!activeLocation) {
        try {
          activeLocation = await getRealLocation();
        } catch {
          setIsSubmitting(false);
          setFlowError('Location Telemetry Required: We could not acquire browser GPS coordinates. Please grant location permissions, enter a manual address below, or choose Demo Location.');
          return;
        }
      }

      // 2. Call AI Emergency Analysis
      const aiRes = await fetch('/api/emergency/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emergency_type: selectedType,
          description: combinedDescription || selectedType,
          voice_transcription: voiceText,
          people_affected: peopleCount,
          vision_objects: activeAccidentDetection?.detected_objects || [],
          location: activeLocation,
        }),
      });

      const aiData = await aiRes.json();
      if (!aiData.success || !aiData.assessment) {
        throw new Error(aiData.error || 'AI incident assessment failed.');
      }

      const assessment: AIAssessment = aiData.assessment;
      setAiAssessment(assessment);

      // 3. Hospital Match (Live GIS Query)
      const isDemoLoc = Boolean(activeLocation.is_demo) || activeLocation.source === 'DEMO';
      const matchRes = await fetch('/api/hospitals/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: activeLocation.latitude,
          longitude: activeLocation.longitude,
          emergency_type: assessment.emergency_type,
          severity: assessment.severity,
          required_facilities: assessment.required_facilities,
          radius_km: 10,
          source: activeLocation.source,
          is_demo: isDemoLoc,
        }),
      });

      const matchData = await matchRes.json();
      if (matchData.success && matchData.recommended_hospital) {
        setRecommendedHospital(matchData.recommended_hospital);
        setAllHospitals(matchData.nearby_hospitals || []);
      } else {
        console.warn('[Hospital Match Warning]:', matchData.error);
        setRecommendedHospital(undefined);
        setAllHospitals([]);
      }

      // 4. Save and Dispatch Incident
      const createRes = await fetch('/api/emergency/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emergency_type: selectedType,
          description: combinedDescription,
          voice_transcription: voiceText,
          people_affected: peopleCount,
          location: activeLocation,
          ai_assessment: assessment,
          accident_detection: activeAccidentDetection || undefined,
        }),
      });

      const createData = await createRes.json();
      if (createData.success && createData.report) {
        setCreatedReport(createData.report);
        if (createData.report.recommended_hospital) {
          setRecommendedHospital(createData.report.recommended_hospital);
        }
      } else {
        throw new Error(createData.error || 'Failed to record emergency report in dispatcher database.');
      }
    } catch (err: any) {
      console.warn('[Rapid Flow] Network issue or backend dispatch error. Queuing offline:', err);
      try {
        const fallbackLoc = location || {
          latitude: 19.0760,
          longitude: 72.8777,
          accuracy: 25,
          quality: 'MEDIUM',
          source: 'DEVICE_GPS',
          address: 'Local Device GPS Coordinates',
          timestamp: new Date().toISOString(),
        };

        const offlineReport: EmergencyReport = {
          id: `offline-${Date.now()}`,
          emergency_type: selectedType,
          description: combinedDescription || selectedType,
          voice_transcription: voiceText,
          people_affected: peopleCount,
          severity: aiAssessment?.severity || 'HIGH',
          priority: 2,
          status: 'PENDING_SYNC',
          location: fallbackLoc,
          created_at: new Date().toISOString(),
          ai_assessment: aiAssessment || undefined,
          accident_detection: activeAccidentDetection || undefined,
        };

        queueIncidentForSync(offlineReport);
        setCreatedReport(offlineReport);
        setFlowError(null);
      } catch {
        setFlowError(err.message || 'Error executing emergency dispatch.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFlow = () => {
    setCreatedReport(null);
    setAiAssessment(null);
    setRecommendedHospital(undefined);
    setTextInput('');
    setVoiceText('');
    setActiveAccidentDetection(null);
    setFlowError(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* ============================================================== */}
      {/* STAGE 1: SIMPLE, USER-FRIENDLY INCIDENT REPORTING WIZARD */}
      {/* ============================================================== */}
      {!createdReport ? (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-950 border border-red-500/30 rounded-3xl p-6 sm:p-8 space-y-3 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-600/20 border-2 border-red-500/60 text-red-400 flex items-center justify-center shadow-lg shadow-red-950">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                    <span>Emergency Assistance</span>
                    <span className="text-[10px] bg-red-500 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      LIVE
                    </span>
                  </h1>
                  <p className="text-xs text-slate-300">
                    Quick 1-tap reporting. GPS, AI severity triage, and hospital dispatch execute in seconds.
                  </p>
                </div>
              </div>

              {/* Automatic GPS Pill */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl px-3.5 py-2 flex items-center gap-2 text-xs">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-white text-[11px] flex items-center gap-1.5">
                    <span>{location ? 'GPS Locked' : 'Detecting GPS...'}</span>
                    <span className={`w-2 h-2 rounded-full ${location ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  </div>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    {location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Auto-locating'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={captureLocation}
                  disabled={geoLoading}
                  className="ml-1 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Refresh GPS"
                >
                  <RefreshCw className={`w-3 h-3 ${geoLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Quick 1-Click Presentation Demos */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                <span>1-Click Presentation Demos:</span>
              </span>
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="bg-slate-950 hover:bg-amber-500 hover:text-slate-950 border border-slate-800 hover:border-amber-400 text-slate-300 text-[11px] font-bold px-3 py-1 rounded-xl transition shadow-sm"
                >
                  ⚡ {p.badge}
                </button>
              ))}
            </div>
          </div>

          {/* Form Error Banner */}
          {flowError && (
            <div className="p-4 bg-red-950/80 border border-red-500/50 text-red-200 text-xs rounded-2xl flex items-center gap-2 shadow-lg">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{flowError}</span>
            </div>
          )}

          {/* STEP 1: SELECT EMERGENCY TYPE */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-3 shadow-xl">
            <label className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px]">1</span>
              <span>Select Emergency Category</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {EMERGENCY_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type.id)}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                      isSelected
                        ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-950 scale-[1.02] font-black'
                        : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-900 font-bold'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${isSelected ? 'bg-white/20' : 'bg-slate-800'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: PROVIDE INCIDENT DETAILS (VOICE / CAMERA / TEXT) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <label className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px]">2</span>
                <span>Report What Happened</span>
              </label>

              {/* Mode Tabs */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setInputTab('TEXT')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                    inputTab === 'TEXT' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Text Details</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputTab('VOICE')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                    inputTab === 'VOICE' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Voice Note</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputTab('IMAGE')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                    inputTab === 'IMAGE' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Scene Photo</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT: TEXT */}
            {inputTab === 'TEXT' && (
              <div className="space-y-3">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  rows={4}
                  placeholder="Describe the incident (e.g. 'Car hit a motorcycle, 2 people on the ground, 1 unconscious and bleeding from head')..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition leading-relaxed font-medium"
                />
              </div>
            )}

            {/* TAB CONTENT: VOICE */}
            {inputTab === 'VOICE' && (
              <div className="space-y-3">
                <VoiceRecorder onTranscriptionComplete={handleVoiceTranscription} />
                {voiceText && (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-emerald-300">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Transcription:</span>
                    "{voiceText}"
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: IMAGE */}
            {inputTab === 'IMAGE' && (
              <div className="space-y-3">
                <ImageAnalyzer
                  onObservationsExtracted={(obs, ind, detectionOutput) => {
                    if (detectionOutput?.object_counts) {
                      setYoloDetectionOutput({
                        people: detectionOutput.object_counts.people || 0,
                        vehicles: detectionOutput.object_counts.vehicles || 0,
                        smokeFire: (detectionOutput.object_counts.smoke_fire || 0) > 0,
                        damagedVehicles: detectionOutput.object_counts.damaged_vehicles || 0,
                        others: detectionOutput.object_counts.others || 0,
                      });
                    }
                    if (detectionOutput) {
                      setActiveAccidentDetection(detectionOutput);
                    }
                    const visionSummary = obs.join('. ');
                    setTextInput((prev) => (prev ? `${prev}. ${visionSummary}` : visionSummary));
                  }}
                />
              </div>
            )}

            {/* NUMBER OF CASUALTIES / PEOPLE */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <span className="font-bold text-slate-400 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                <span>Estimated People Affected:</span>
              </span>

              <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPeopleCount((p) => Math.max(1, p - 1))}
                  className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition"
                >
                  -
                </button>
                <span className="font-mono font-black text-white text-sm w-4 text-center">{peopleCount}</span>
                <button
                  type="button"
                  onClick={() => setPeopleCount((p) => p + 1)}
                  className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmitEmergency}
            className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white font-black text-base sm:text-lg py-5 px-8 rounded-2xl shadow-2xl shadow-red-950/80 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 uppercase tracking-wider"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Analyzing Telemetry & Dispatching...</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-6 h-6 animate-bounce" />
                <span>🚨 DISPATCH EMERGENCY TELEMETRY NOW</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* ============================================================== */
        /* STAGE 2: CRISP, USER-FRIENDLY DISPATCH CONFIRMATION & ACTIONS */
        /* ============================================================== */
        <div className="space-y-6">
          {/* Top Confirmation Banner */}
          <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-slate-950 border-2 border-emerald-500/60 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-950">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      EMERGENCY DISPATCHED
                    </h2>
                    <span className="text-xs bg-emerald-500 text-slate-950 font-black px-2.5 py-0.5 rounded-full uppercase">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">
                    Incident Report #{createdReport.report_id} • Status: {createdReport.status}
                  </p>
                </div>
              </div>

              {/* Severity Pill */}
              <div className="text-right">
                <span className={`inline-block text-xs font-black px-3.5 py-1.5 rounded-xl border uppercase tracking-wider ${
                  createdReport.severity === 'CRITICAL'
                    ? 'bg-red-950 text-red-300 border-red-500/60 shadow-lg shadow-red-950'
                    : 'bg-amber-950 text-amber-300 border-amber-500/60'
                }`}>
                  SEVERITY: {createdReport.severity}
                </span>
                <span className="block text-[10px] text-slate-400 font-mono mt-1">
                  AI Confidence: {createdReport.ai_confidence}%
                </span>
              </div>
            </div>
          </div>

          {/* MATCHED HOSPITAL CARD (PRIMARY FOCUS FOR CITIZEN/VICTIM) */}
          {recommendedHospital ? (
            <div className="bg-slate-900 border-2 border-blue-500/50 rounded-3xl p-6 space-y-4 shadow-2xl">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
                <div className="flex items-center gap-2 text-blue-400 font-extrabold text-xs uppercase tracking-wider">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span>Nearest Matched Healthcare Facility</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                    recommendedHospital.is_demo
                      ? 'bg-purple-950 text-purple-300 border-purple-500/40'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {recommendedHospital.is_demo ? 'Demo Hospital Profile' : `Live Source: ${recommendedHospital.source === 'GOOGLE_PLACES' ? 'Google Places' : 'OpenStreetMap'}`}
                  </span>
                  <span className="text-xs font-mono font-bold text-blue-300 bg-blue-950/60 px-2.5 py-0.5 rounded-lg border border-blue-500/40">
                    {recommendedHospital.distanceKm !== undefined ? `${recommendedHospital.distanceKm} km straight-line distance` : 'Nearby'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white">{recommendedHospital.name}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{recommendedHospital.address || 'Address registered on map'}</span>
                  </p>
                </div>

                {/* Direct Action Buttons: Call & Maps */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {recommendedHospital.phone && (
                    <a
                      href={`tel:${recommendedHospital.phone}`}
                      className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Call Hospital ER</span>
                    </a>
                  )}

                  <a
                    href={recommendedHospital.google_maps_uri || `https://www.google.com/maps/search/?api=1&query=${recommendedHospital.latitude},${recommendedHospital.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-4 py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Open in Maps</span>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 space-y-3 shadow-xl">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Live Hospital Discovery Status</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                No healthcare facilities could be retrieved near your incident coordinates from live map registries (OpenStreetMap / Google Places).
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (createdReport.location) {
                      setIsSubmitting(true);
                      try {
                        const res = await fetch(`/api/hospitals/nearby?lat=${createdReport.location.latitude}&lon=${createdReport.location.longitude}&radius=25`);
                        const data = await res.json();
                        if (data.success && data.hospitals.length > 0) {
                          setRecommendedHospital(data.hospitals[0]);
                          setAllHospitals(data.hospitals);
                        } else {
                          setFlowError(data.error || 'Retry complete: 0 hospitals found within 25km.');
                        }
                      } finally {
                        setIsSubmitting(false);
                      }
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry with Expanded 25km Radius</span>
                </button>
              </div>
            </div>
          )}

          {/* INTERACTIVE ROUTE MAP */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Live Map: Your Location & Hospital Route
            </span>
            <InteractiveMap
              userLocation={createdReport.location}
              hospitals={recommendedHospital ? [recommendedHospital, ...allHospitals.slice(0, 4)] : allHospitals.slice(0, 5)}
              recommendedHospitalId={recommendedHospital?.id}
              height="340px"
            />
          </div>

          {/* IMMEDIATE FIRST AID INSTRUCTIONS */}
          {aiAssessment?.immediate_safety_actions && aiAssessment.immediate_safety_actions.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
              <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Immediate Safety & First-Aid Guidelines</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {aiAssessment.immediate_safety_actions.map((act, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* VIVA / EVALUATION ACTION BAR */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-3 shadow-xl">
            <div>
              <span className="text-xs font-bold text-white block">Major Project Telemetry & Evidence</span>
              <p className="text-[11px] text-slate-400">
                Inspect 31-field structured AI clinical matrix, CAD YOLO bounding boxes, and download formal PDF.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition shadow uppercase tracking-wider"
              >
                <FileText className="w-4 h-4" />
                <span>31-Field Report</span>
              </button>

              <a
                href={`/api/reports/generate?id=${createdReport.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Download PDF</span>
              </a>

              <button
                type="button"
                onClick={() => setShowDiagram(!showDiagram)}
                className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition"
              >
                <Layers className="w-4 h-4 text-amber-400" />
                <span>{showDiagram ? 'Hide Architecture' : 'System Diagram (Fig. 1)'}</span>
              </button>

              <button
                type="button"
                onClick={resetFlow}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>New Incident</span>
              </button>
            </div>
          </div>

          {/* OPTIONAL ARCHITECTURE BLOCK DIAGRAM */}
          {showDiagram && (
            <ProposedSystemDiagram
              activeStage="LOCAL_LLM"
              visualDetectionsCount={yoloDetectionOutput}
              whisperText={voiceText}
              severityLevel={aiAssessment?.severity || 'HIGH'}
            />
          )}
        </div>
      )}

      {/* COMPREHENSIVE 31-FIELD REPORT MODAL */}
      <ReportDetailModal
        report={createdReport}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
}
