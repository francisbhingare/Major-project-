'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmergencyType } from '@/types/emergency';
import { useGeolocation } from '@/hooks/useGeolocation';
import { VoiceRecorder } from './VoiceRecorder';
import { TranscriptionEditor } from './TranscriptionEditor';
import { MediaUploader } from './MediaUploader';
import { InteractiveMap } from '@/components/map/InteractiveMap';
import { ShieldAlert, MapPin, Users, FileText, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

export function EmergencyForm() {
  const router = useRouter();
  const { location, loading: geoLoading, error: geoError, captureLocation, getRealLocation } = useGeolocation();

  const [emergencyType, setEmergencyType] = useState<EmergencyType>('Road Accident');
  const [description, setDescription] = useState('');
  const [peopleAffected, setPeopleAffected] = useState(1);
  const [voiceText, setVoiceText] = useState('');
  const [voiceLang, setVoiceLang] = useState('English');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const emergencyOptions: EmergencyType[] = [
    'Road Accident',
    'Fire',
    'Medical Emergency',
    'Injury',
    'Unconscious Person',
    'Chest Pain',
    'Breathing Difficulty',
    'Cardiac Emergency',
    'Burn',
    'Fall',
    'Other',
  ];

  const handleVoiceTranscription = (text: string, lang: string) => {
    setVoiceText(text);
    setVoiceLang(lang);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Combine typed and voice descriptions intelligently
    let combinedDescription = description.trim();
    if (voiceText.trim()) {
      if (combinedDescription) {
        if (!combinedDescription.endsWith('.')) combinedDescription += '.';
        combinedDescription += ` ${voiceText.trim()}`;
      } else {
        combinedDescription = voiceText.trim();
      }
    }

    if (!combinedDescription) {
      setFormError('Please provide a typed description or record a voice note.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Trigger AI Severity Analysis
      const aiRes = await fetch('/api/emergency/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emergency_type: emergencyType,
          description: combinedDescription,
          voice_transcription: voiceText,
          people_affected: peopleAffected,
        }),
      });

      const aiData = await aiRes.json();
      const assessment = aiData.assessment;

      // 2. Resolve genuine location - never use hardcoded coordinates
      let activeLocation = location;
      if (!activeLocation) {
        try {
          activeLocation = await getRealLocation();
        } catch {
          setFormError('Current GPS location is required to dispatch emergency response and locate nearby hospitals. Please enable location permissions.');
          setIsSubmitting(false);
          return;
        }
      }

      // 3. Submit complete emergency report payload
      const createRes = await fetch('/api/emergency/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emergency_type: emergencyType,
          description: combinedDescription,
          voice_transcription: voiceText,
          people_affected: peopleAffected,
          location: activeLocation,
          ai_assessment: assessment,
        }),
      });

      const createData = await createRes.json();

      if (createData.success && createData.report) {
        router.push(`/emergency/${createData.report.id}`);
      } else {
        setFormError(createData.error || 'Failed to submit emergency report.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Server connection error during emergency creation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      {formError && (
        <div className="p-4 bg-red-950/80 border border-red-500 text-red-200 text-xs sm:text-sm rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          <span>{formError}</span>
        </div>
      )}

      {/* STEP 1: Emergency Type Selection */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-3">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
          1. Select Emergency Type
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {emergencyOptions.map((option) => {
            const isSelected = emergencyType === option;
            return (
              <button
                type="button"
                key={option}
                onClick={() => setEmergencyType(option)}
                className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between ${
                  isSelected
                    ? 'bg-red-600/20 border-red-500 text-red-400 ring-2 ring-red-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span>{option}</span>
                {isSelected && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 2: Affected Count & Text Description */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span>2. Describe the Situation</span>
          </label>

          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300 font-semibold">People Affected:</span>
            <input
              type="number"
              min={1}
              max={100}
              value={peopleAffected}
              onChange={(e) => setPeopleAffected(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-12 bg-slate-900 border border-slate-700 rounded text-center text-white font-bold py-0.5"
            />
          </div>
        </div>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="Describe what happened, patient symptoms, active bleeding, consciousness..."
        />
      </div>

      {/* STEP 3: Voice Note Recording */}
      <VoiceRecorder onTranscriptionComplete={handleVoiceTranscription} />

      {voiceText && (
        <TranscriptionEditor
          transcription={voiceText}
          detectedLanguage={voiceLang}
          onAccept={(edited) => setVoiceText(edited)}
        />
      )}

      {/* STEP 4: Media Upload */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6">
        <MediaUploader onMediaSelect={(files) => setMediaFiles(files)} />
      </div>

      {/* STEP 5: GPS Location & Map */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500" />
              <span>5. Capture GPS Incident Location</span>
            </label>
            {location && (
              <p className="text-xs text-emerald-400 mt-1 font-mono">
                ✓ Location Captured: Lat {location.latitude.toFixed(4)}, Lon {location.longitude.toFixed(4)} (±{location.accuracy}m)
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={captureLocation}
            disabled={geoLoading}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow"
          >
            {geoLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
            <span>[USE MY CURRENT LOCATION]</span>
          </button>
        </div>

        {geoError && (
          <p className="text-xs text-amber-300 bg-amber-950/40 p-2.5 rounded-xl border border-amber-500/20">
            ⚠️ {geoError}
          </p>
        )}

        <InteractiveMap userLocation={location} height="280px" />
      </div>

      {/* SUBMIT EMERGENCY BUTTON */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white font-black text-lg py-5 px-6 rounded-2xl shadow-2xl shadow-red-950/80 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 uppercase tracking-wider"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span>Analyzing with AI & Matching Hospital...</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-6 h-6 animate-pulse" />
              <span>[SUBMIT EMERGENCY REPORT NOW]</span>
            </>
          )}
        </button>

        <p className="text-center text-xs text-slate-400 mt-3">
          AI-assisted emergency response system. Recommended hospital will be notified automatically.
        </p>
      </div>
    </form>
  );
}
