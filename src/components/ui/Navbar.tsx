'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Siren, Activity, Hospital as HospitalIcon, Clock, ShieldAlert, KeyRound, Menu, X, LogOut } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  let navLinks: { href: string; label: string; primary?: boolean; icon?: any }[] = [];

  if (isAuthenticated && isAdmin) {
    navLinks = [
      { href: '/admin', label: 'Admin Dashboard', icon: Activity },
      { href: '/admin/system-diagnostics', label: 'Diagnostics', icon: ShieldAlert },
      { href: '/hospitals', label: 'Hospitals', icon: HospitalIcon },
    ];
  } else {
    navLinks = [
      { href: '/', label: 'Home' },
      { href: '/report', label: 'Report Emergency', primary: true },
      { href: '/dashboard', label: 'Command Center', icon: Activity },
      { href: '/hospitals', label: 'Hospitals', icon: HospitalIcon },
      { href: '/history', label: 'History', icon: Clock },
      { href: '/admin', label: 'Admin Hub', icon: ShieldAlert },
    ];
  }

  return (
    <nav className="bg-slate-900/95 backdrop-blur border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white shadow-lg shadow-red-900/30 group-hover:scale-105 transition-transform">
              <Siren className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white tracking-tight">AI EMERGENCY</span>
                <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-500/40 uppercase">
                  RESPONSE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Public Emergency Platform</p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link, idx) => {
              const isActive = pathname === link.href;
              if (link.primary) {
                return (
                  <Link
                    key={`${link.href}-${idx}`}
                    href={link.href}
                    className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold px-4 py-2 rounded-lg shadow-lg shadow-red-950/40 transition-all hover:scale-[1.02] text-sm"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>REPORT EMERGENCY</span>
                  </Link>
                );
              }

              return (
                <Link
                  key={`${link.href}-${idx}`}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-red-400 border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {link.icon && <link.icon className="w-4 h-4 opacity-80" />}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Action / Admin Link */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated && isAdmin ? (
              <button
                onClick={logout}
                className="bg-red-950/80 hover:bg-red-900 text-red-300 text-xs font-bold px-3.5 py-1.5 rounded-lg border border-red-500/30 flex items-center gap-1.5 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout Admin</span>
              </button>
            ) : (
              <Link
                href="/admin/login"
                className="text-slate-500 hover:text-amber-400 text-xs font-mono flex items-center gap-1 transition"
                title="Administrator Command Login"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Admin</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <Link
              href="/report"
              className="bg-red-600 text-white font-bold text-xs px-2.5 py-1.5 rounded-md flex items-center gap-1"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>REPORT</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
