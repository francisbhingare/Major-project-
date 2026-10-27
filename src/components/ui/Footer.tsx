import React from 'react';
import Link from 'next/link';
import { Siren, ShieldAlert, HeartPulse, PhoneCall, Info } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 py-10 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Col 1: System Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <Siren className="w-5 h-5 text-red-500" />
            <span>AI Emergency Response</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            AI-assisted emergency reporting, severity assessment, GPS location detection, and rapid hospital coordination platform.
          </p>
          <div className="inline-flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-[11px] text-slate-300">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>BTech Final Year Project Prototype</span>
          </div>
        </div>

        {/* Col 2: Quick Links */}
        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Quick Navigation</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/" className="hover:text-red-400 transition-colors">Home Landing</Link></li>
            <li><Link href="/report" className="hover:text-red-400 transition-colors font-semibold text-red-400">Report Emergency</Link></li>
            <li><Link href="/hospitals" className="hover:text-red-400 transition-colors">Nearby Hospitals</Link></li>
            <li><Link href="/dashboard" className="hover:text-red-400 transition-colors">Responder Dashboard</Link></li>
            <li><Link href="/admin" className="hover:text-red-400 transition-colors">Demo Mode & Scenarios</Link></li>
          </ul>
        </div>

        {/* Col 3: Medical Emergency Disclaimer */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Safety Disclaimer</span>
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            This application generates AI-assisted assessments for informational and coordination purposes. It is <strong>NOT</strong> a substitute for professional medical advice, diagnosis, or emergency dispatch.
          </p>
          <p className="text-[11px] text-amber-300/80 bg-amber-950/40 border border-amber-500/20 p-2 rounded">
            AI-generated assessment — verify with qualified emergency personnel.
          </p>
        </div>

        {/* Col 4: Emergency Contacts */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <PhoneCall className="w-4 h-4 text-red-400" />
            <span>National Emergency Lines</span>
          </h4>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
              <span className="text-slate-300">Universal Emergency</span>
              <span className="font-bold text-red-400">112 / 911</span>
            </div>
            <div className="flex justify-between bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
              <span className="text-slate-300">Ambulance Dispatch</span>
              <span className="font-bold text-red-400">102</span>
            </div>
            <div className="flex justify-between bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
              <span className="text-slate-300">Fire & Rescue</span>
              <span className="font-bold text-red-400">101</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-slate-900 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
        <p>© 2026 AI Emergency Response System. BTech Engineering Project Prototype.</p>
        <div className="flex items-center gap-4">
          <span className="text-slate-400">Built with React, Next.js, Node.js & OpenAI</span>
        </div>
      </div>
    </footer>
  );
}
