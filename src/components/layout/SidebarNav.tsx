'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Siren,
  LayoutDashboard,
  ShieldAlert,
  Hospital,
  History,
  Activity,
  Menu,
  X,
  ShieldCheck,
  LogOut,
  KeyRound
} from 'lucide-react';

export function SidebarNav() {
  const pathname = usePathname();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Dynamic Public vs Admin Navigation Items
  let navItems: { href: string; label: string; icon: any; highlight?: boolean }[] = [];

  if (isAuthenticated && isAdmin) {
    navItems = [
      { href: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
      { href: '/admin', label: 'Emergency Incidents', icon: ShieldAlert },
      { href: '/hospitals', label: 'Hospitals Network', icon: Hospital },
      { href: '/admin/system-diagnostics', label: 'System Diagnostics', icon: Activity },
    ];
  } else {
    // Public User Navigation (No Login Required)
    navItems = [
      { href: '/', label: 'Overview Dashboard', icon: LayoutDashboard },
      { href: '/report', label: 'Report Emergency', icon: ShieldAlert, highlight: true },
      { href: '/hospitals', label: 'Nearby Hospitals', icon: Hospital },
      { href: '/history', label: 'Incident History', icon: History },
    ];
  }

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="lg:hidden bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2 font-black text-white text-base tracking-tight">
          <div className="w-8 h-8 rounded-xl bg-red-600/20 text-red-500 border border-red-500/40 flex items-center justify-center">
            <Siren className="w-4 h-4 animate-pulse" />
          </div>
          <span>AI EMERGENCY SYSTEM</span>
        </Link>

        <div className="flex items-center gap-2">
          {isAuthenticated && isAdmin ? (
            <button
              onClick={logout}
              className="p-2 bg-red-950 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/report"
              className="bg-red-600 text-white font-bold text-xs px-2.5 py-1.5 rounded-md flex items-center gap-1"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>REPORT</span>
            </Link>
          )}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 hover:text-white"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Persistent Desktop Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900/95 border-r border-slate-800 p-5 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="space-y-6">
          {/* Logo Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-600/20 text-red-500 border border-red-500/40 flex items-center justify-center shadow-lg shadow-red-950/50">
                <Siren className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="font-black text-white text-sm tracking-tight block leading-none">AI EMERGENCY</span>
                <span className="text-[10px] text-slate-400 font-mono">RESPONSE PLATFORM</span>
              </div>
            </Link>
          </div>

          {/* Admin Info Badge if logged in */}
          {isAuthenticated && isAdmin && user && (
            <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white truncate">{user.name}</span>
                <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded uppercase">
                  ADMIN
                </span>
              </div>
              <p className="text-[10px] text-amber-300/80 font-mono truncate">{user.email}</p>
            </div>
          )}

          {/* Nav Links */}
          <nav className="space-y-1.5 text-xs">
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={`${item.href}-${idx}`}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-950/60'
                      : item.highlight
                      ? 'bg-red-950/60 text-red-400 border border-red-500/30 hover:bg-red-900/80'
                      : 'text-slate-300 hover:bg-slate-950 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-red-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions & Unobtrusive Admin Link */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          {isAuthenticated && isAdmin ? (
            <button
              onClick={logout}
              className="w-full bg-red-950/60 hover:bg-red-900 text-red-300 font-bold text-xs py-2.5 px-3 rounded-xl border border-red-500/30 flex items-center justify-center gap-2 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout Admin</span>
            </button>
          ) : (
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>System Status: <strong className="text-emerald-400">READY</strong></span>
              <Link
                href="/admin/login"
                className="text-slate-500 hover:text-amber-400 flex items-center gap-1 font-mono transition"
                title="Administrator Command Login"
              >
                <KeyRound className="w-3 h-3" />
                <span>Admin</span>
              </Link>
            </div>
          )}

          <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-1 text-[10px]">
            <div className="flex items-center justify-between font-mono">
              <span className="text-slate-400">OPENSTREETMAP</span>
              <span className="text-emerald-400 font-bold">● CONNECTED</span>
            </div>
            <div className="flex items-center justify-between font-mono">
              <span className="text-slate-400">GPS TELEMETRY</span>
              <span className="text-emerald-400 font-bold">● ACTIVE</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
