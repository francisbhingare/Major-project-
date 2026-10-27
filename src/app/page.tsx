import React from 'react';
import Link from 'next/link';
import { 
  Siren, 
  Mic, 
  BrainCircuit, 
  MapPin, 
  Hospital, 
  FileText, 
  Mail, 
  ShieldAlert, 
  ArrowRight, 
  CheckCircle2, 
  Activity, 
  Clock, 
  PhoneCall,
  Sparkles,
  Layers
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { ProposedSystemDiagram } from '@/components/system/ProposedSystemDiagram';

export default function LandingPage() {
  return (
    <div className="space-y-12 pb-10">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 sm:p-10 lg:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-950/80 border border-red-500/40 text-red-400 text-xs font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              <span>BTech Final-Year Major Project Architecture</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              AI Emergency <br />
              <span className="bg-gradient-to-r from-red-500 via-rose-400 to-amber-400 bg-clip-text text-transparent">
                Response System
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              AI-assisted emergency reporting, Local YOLO object detection, Whisper voice STT, Local LLM reasoning, GPS location detection, and rapid hospital coordination platform.
            </p>

            {/* Prominent Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/report"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-black text-lg px-8 py-5 rounded-2xl shadow-2xl shadow-red-950/80 transition-all hover:scale-[1.03] active:scale-[0.98] uppercase tracking-wider"
              >
                <ShieldAlert className="w-7 h-7 animate-bounce" />
                <span>🚨 START EMERGENCY RESPONSE</span>
                <ArrowRight className="w-5 h-5" />
              </Link>

              <Link
                href="/user"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-base px-6 py-5 rounded-2xl border border-slate-700 transition-all hover:text-white"
              >
                <Activity className="w-5 h-5 text-blue-400" />
                <span>USER DASHBOARD</span>
              </Link>

              <Link
                href="/admin"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-semibold text-sm px-5 py-5 rounded-2xl border border-amber-500/30 transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>ADMIN COMMAND</span>
              </Link>
            </div>

            {/* Safety Banner Notice */}
            <div className="p-3.5 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>
                <strong>IMPORTANT:</strong> AI decision-support platform. For life-threatening emergencies, dial 112 / 911 immediately.
              </span>
            </div>
          </div>

          {/* Right Card Mockup / Fast Access Box */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Siren className="w-4 h-4 text-red-500" />
                  <span>Proposed Multimodal Architecture</span>
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                  SYSTEM ACTIVE
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Mic className="w-4 h-4 text-purple-400" />
                    <span>Local Whisper Model (STT)</span>
                  </div>
                  <span className="text-[10px] text-purple-300 font-semibold">VOICE TO TEXT</span>
                </div>

                <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <BrainCircuit className="w-4 h-4 text-red-400" />
                    <span>Local YOLO Model</span>
                  </div>
                  <span className="text-[10px] text-red-300 font-semibold">OBJECT DETECTION</span>
                </div>

                <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <span>Multimodal Fusion & Local LLM</span>
                  </div>
                  <span className="text-[10px] text-blue-300 font-semibold">LLAMA / MISTRAL</span>
                </div>

                <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Hospital className="w-4 h-4 text-amber-400" />
                    <span>Offline Storage & Network Sync</span>
                  </div>
                  <span className="text-[10px] text-amber-300 font-semibold">OFFLINE FIRST</span>
                </div>
              </div>

              <Link
                href="/report"
                className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold py-3 px-4 rounded-xl text-sm hover:from-red-500 hover:to-rose-500 transition-all shadow-md"
              >
                <span>Launch Emergency Response Wizard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* METRICS STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Emergencies" value="2" subtitle="Monitored in real-time" icon={Siren} color="red" />
        <StatCard title="Demo Hospitals" value="5" subtitle="Trauma & specialized units" icon={Hospital} color="amber" />
        <StatCard title="AI Analysis Confidence" value="95%" subtitle="Automated triage scoring" icon={BrainCircuit} color="purple" />
        <StatCard title="Avg Dispatch Alert" value="< 30s" subtitle="Auto PDF + Email delivery" icon={Mail} color="emerald" />
      </div>

      {/* PROPOSED SYSTEM BLOCK DIAGRAM (Fig. 1) */}
      <ProposedSystemDiagram />

      {/* KEY FEATURES GRID */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Core Technological Features
          </h2>
          <p className="text-sm text-slate-400">
            Engineered for high speed, reliability, and clear emergency triage during critical situations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Voice & Local Whisper STT</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Record audio notes. Local Whisper Model transcribes speech into text for seamless multimodal fusion and LLM triage.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors space-y-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Local YOLO Object Detection</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Extracts object counts & bounding boxes for People, Vehicles, Smoke/Fire, Damaged Vehicles, and others.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">GPS & OpenStreetMap Leaflet</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Captures exact latitude/longitude with accuracy radiuses and renders interactive OpenStreetMap views with turn-by-turn directions.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Hospital className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Smart Hospital Matching</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Multi-factor scoring matches victims to the most suitable hospital based on specialized capabilities rather than proximity alone.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Automated PDF Generator</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generates formal emergency reports with timestamps, coordinates, AI reasoning, required facilities, and safety disclaimers.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Offline Storage & Sync</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Saves reports offline when internet is unavailable and automatically synchronizes alerts as soon as network connects.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="text-center bg-gradient-to-r from-red-950/60 via-slate-900 to-amber-950/40 border border-slate-800 rounded-3xl p-8 space-y-4">
        <h2 className="text-2xl font-bold text-white">Ready for Presentation Demonstration?</h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Test pre-loaded emergency scenarios (Road Accident, Cardiac Emergency, Fire Injury) in Demo Mode or submit a live report.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <Link
            href="/report"
            className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-lg"
          >
            Start Emergency Report
          </Link>
          <Link
            href="/admin"
            className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold px-6 py-3 rounded-xl text-sm border border-slate-700"
          >
            Open Admin Command Hub
          </Link>
        </div>
      </section>
    </div>
  );
}
