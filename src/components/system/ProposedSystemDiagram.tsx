'use client';

import React, { useState, useEffect } from 'react';
import {
  Camera,
  Mic,
  Cpu,
  Layers,
  Sparkles,
  Database,
  Wifi,
  WifiOff,
  Send,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Box,
  FileText,
  Activity,
  ArrowRight,
  ArrowDown
} from 'lucide-react';

interface ProposedSystemDiagramProps {
  activeStage?: 'IDLE' | 'CAMERA_INPUT' | 'YOLO_DETECTION' | 'WHISPER_AUDIO' | 'FUSION' | 'LOCAL_LLM' | 'STORAGE_OFFLINE' | 'SYNC_ALERT';
  visualDetectionsCount?: { people: number; vehicles: number; smokeFire: boolean; damagedVehicles: number; others: number };
  whisperText?: string;
  severityLevel?: string;
  isOnline?: boolean;
}

export function ProposedSystemDiagram({
  activeStage = 'IDLE',
  visualDetectionsCount = { people: 0, vehicles: 0, smokeFire: false, damagedVehicles: 0, others: 0 },
  whisperText = '',
  severityLevel = 'HIGH',
  isOnline: propOnline,
}: ProposedSystemDiagramProps) {
  const [online, setOnline] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOnline(navigator.onLine);
      const handleOnline = () => setOnline(true);
      const handleOffline = () => setOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const isOnline = propOnline !== undefined ? propOnline : online;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-amber-400 bg-amber-950 px-2.5 py-0.5 rounded border border-amber-500/40 uppercase">
              PROPOSED SYSTEM ARCHITECTURE
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Fig. 1: Block diagram of the proposed system</span>
          </div>
          <h2 className="text-lg font-black text-white mt-1">
            Offline-First Multimodal AI Emergency Response Architecture
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono border ${
            isOnline
              ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
              : 'bg-amber-950 text-amber-300 border-amber-500/40 animate-pulse'
          }`}>
            {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-amber-400" />}
            <span>INTERNET: {isOnline ? 'AVAILABLE (ONLINE)' : 'UNAVAILABLE (OFFLINE)'}</span>
          </div>
        </div>
      </div>

      {/* BLOCK DIAGRAM GRID FLOW (Matching Fig. 1) */}
      <div className="space-y-6 text-xs font-mono">
        {/* ROW 1: Visual Object Detection Pipeline (YOLO) */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-[11px] font-bold text-blue-400 uppercase">
            <span className="flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-blue-400" />
              1. Visual Object Detection Pipeline
            </span>
            <span className="text-slate-500 font-normal text-[10px]">Image & Video Stream</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Box 1.1: Camera */}
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center space-y-1">
              <span className="font-bold text-white block">CAMERA</span>
              <span className="text-[10px] text-slate-400">Sensor Capture</span>
            </div>

            {/* Box 1.2: Image / Video Input */}
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center space-y-1">
              <span className="font-bold text-white block">IMAGE / VIDEO INPUT</span>
              <span className="text-[10px] text-slate-400">Frames / JPEG / PNG</span>
            </div>

            {/* Box 1.3: Local YOLO Model */}
            <div className={`p-3 rounded-xl border space-y-1 transition-all ${
              activeStage === 'YOLO_DETECTION'
                ? 'bg-blue-950 border-blue-500 text-blue-200 ring-2 ring-blue-500/40'
                : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}>
              <div className="flex items-center justify-center gap-1 font-bold text-blue-400">
                <Box className="w-3.5 h-3.5" />
                <span>LOCAL YOLO MODEL</span>
              </div>
              <span className="text-[10px] text-slate-400 block text-center">(Object Detection)</span>
              <ul className="text-[9px] text-slate-400 pt-1 space-y-0.5 border-t border-slate-800">
                <li>• People ({visualDetectionsCount.people})</li>
                <li>• Vehicles ({visualDetectionsCount.vehicles})</li>
                <li>• Smoke / Fire ({visualDetectionsCount.smokeFire ? 'Yes' : 'No'})</li>
                <li>• Damaged Vehicle ({visualDetectionsCount.damagedVehicles})</li>
                <li>• Others ({visualDetectionsCount.others})</li>
              </ul>
            </div>

            {/* Box 1.4: Detection Output */}
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-white block text-center">DETECTION OUTPUT</span>
              <span className="text-[10px] text-slate-400 block text-center">Object List + Count + Bounding Boxes</span>
              <div className="bg-slate-950 p-1.5 rounded border border-slate-800 text-[9px] text-emerald-400 mt-1">
                ✓ Bounding box coordinates generated
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: Audio Speech to Text Pipeline (Whisper) */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-[11px] font-bold text-purple-400 uppercase">
            <span className="flex items-center gap-1.5">
              <Mic className="w-4 h-4 text-purple-400" />
              2. Audio Processing Pipeline
            </span>
            <span className="text-slate-500 font-normal text-[10px]">Speech to Text Stream</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Box 2.1: Microphone */}
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center space-y-1">
              <span className="font-bold text-white block">MICROPHONE</span>
              <span className="text-[10px] text-slate-400">Audio Stream</span>
            </div>

            {/* Box 2.2: Audio Input */}
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center space-y-1">
              <span className="font-bold text-white block">AUDIO INPUT</span>
              <span className="text-[10px] text-slate-400">WAV / MP3 Recording</span>
            </div>

            {/* Box 2.3: Local Whisper Model */}
            <div className={`p-3 rounded-xl border text-center space-y-1 transition-all ${
              activeStage === 'WHISPER_AUDIO'
                ? 'bg-purple-950 border-purple-500 text-purple-200 ring-2 ring-purple-500/40'
                : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}>
              <span className="font-bold text-purple-400 block">LOCAL WHISPER MODEL</span>
              <span className="text-[10px] text-slate-400 block">(Speech to Text)</span>
            </div>

            {/* Box 2.4: Transcribed Text */}
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-white block text-center">TRANSCRIBED TEXT</span>
              <span className="text-[10px] text-slate-400 block text-center">(Voice to Text)</span>
              {whisperText && (
                <p className="text-[9px] text-purple-300 italic truncate bg-slate-950 p-1 rounded mt-1">
                  "{whisperText}"
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ROW 3: Multimodal Fusion & Local LLM Reasoning Engine */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-400 uppercase">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-amber-400" />
              3. Multimodal Fusion & Local LLM Reasoning
            </span>
            <span className="text-slate-500 font-normal text-[10px]">Llama / Mistral / Gemma</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Box 3.1: Multimodal Fusion */}
            <div className={`p-3.5 rounded-xl border space-y-1.5 transition-all ${
              activeStage === 'FUSION'
                ? 'bg-amber-950 border-amber-500 text-amber-200 ring-2 ring-amber-500/40'
                : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}>
              <div className="flex items-center gap-1.5 font-bold text-amber-400">
                <Layers className="w-4 h-4" />
                <span>MULTIMODAL FUSION</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Combine Visual Detections (YOLO) + Transcribed Text (Whisper) + GPS Location
              </p>
            </div>

            {/* Box 3.2: Local LLM */}
            <div className={`p-3.5 rounded-xl border space-y-1.5 transition-all ${
              activeStage === 'LOCAL_LLM'
                ? 'bg-amber-950 border-amber-500 text-amber-200 ring-2 ring-amber-500/40 animate-pulse'
                : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">LOCAL LLM</span>
                <span className="text-[9px] bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                  Llama / Mistral / Gemma
                </span>
              </div>
              <p className="text-[10px] text-slate-400">(Analysis & Reasoning)</p>
            </div>

            {/* Box 3.3: Incident Assessment */}
            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-white block">INCIDENT ASSESSMENT</span>
              <span className="text-[10px] text-slate-400 block">(Severity Level)</span>
              <ul className="text-[9px] text-slate-300 space-y-0.5 pt-1">
                <li>• Severity: <strong className="text-red-400">{severityLevel}</strong></li>
                <li>• Incident Type: Extracted Automatically</li>
                <li>• Clinical Telemetry Summary Generated</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ROW 4: Emergency Report, Local Offline Storage & Network Alert Dispatch Pipeline */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400 uppercase">
            <span className="flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-400" />
              4. Emergency Report & Offline Sync Pipeline
            </span>
            <span className="text-slate-500 font-normal text-[10px]">Local Storage & Network Dispatch</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Box 4.1: Emergency Report */}
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-white block">EMERGENCY REPORT</span>
              <ul className="text-[9px] text-slate-400 space-y-0.5">
                <li>• Incident Summary</li>
                <li>• Detected Objects</li>
                <li>• Voice Report</li>
                <li>• Severity</li>
                <li>• Time & (Optional) Location</li>
              </ul>
            </div>

            {/* Box 4.2: Local Storage (Store Offline) */}
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">LOCAL STORAGE</span>
                <span className="text-[8px] bg-slate-800 text-slate-300 px-1 py-0.5 rounded">Store Offline</span>
              </div>
              <ul className="text-[9px] text-slate-400 space-y-0.5">
                <li>• Reports</li>
                <li>• Images</li>
                <li>• Audio</li>
                <li>• Logs</li>
              </ul>
            </div>

            {/* Box 4.3: Internet Available? Decision */}
            <div className={`p-3 rounded-xl border space-y-1 text-center ${
              isOnline ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
            }`}>
              <span className="font-bold block">INTERNET AVAILABLE?</span>
              <div className="flex items-center justify-center gap-2 text-[10px] pt-1 font-bold">
                <span className={isOnline ? 'text-emerald-400' : 'text-slate-600'}>YES →</span>
                <span className={!isOnline ? 'text-amber-400' : 'text-slate-600'}>← NO</span>
              </div>
            </div>

            {/* Box 4.4: Outcome (Sync/Send Alert vs Continue Offline) */}
            <div className="space-y-2">
              {isOnline ? (
                <div className="bg-emerald-950/80 border border-emerald-500/50 p-3 rounded-xl text-emerald-200 text-center space-y-1 shadow">
                  <div className="flex items-center justify-center gap-1 font-bold text-xs text-emerald-400">
                    <Send className="w-3.5 h-3.5" />
                    <span>SYNC / SEND ALERT</span>
                  </div>
                  <span className="text-[9px] block text-emerald-300">
                    (When Internet Becomes Available)
                  </span>
                </div>
              ) : (
                <div className="bg-amber-950/80 border border-amber-500/50 p-3 rounded-xl text-amber-200 text-center space-y-1 shadow">
                  <div className="flex items-center justify-center gap-1 font-bold text-xs text-amber-400">
                    <Database className="w-3.5 h-3.5" />
                    <span>CONTINUE WORKING OFFLINE</span>
                  </div>
                  <span className="text-[9px] block text-amber-300">
                    Saved locally in IndexedDB / Store
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
