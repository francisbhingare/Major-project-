'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, RefreshCw, AlertCircle, KeyRound, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isAdmin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If already authenticated as admin, redirect to /admin
  React.useEffect(() => {
    if (isAuthenticated && isAdmin) {
      router.push('/admin');
    }
  }, [isAuthenticated, isAdmin, router]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both admin email and secret password.');
      return;
    }

    setSubmitting(true);
    const res = await login(email, password, 'admin');
    setSubmitting(false);

    if (res.success) {
      router.push('/admin');
    } else {
      setErrorMsg(res.error || 'Access Denied. Invalid administrator credentials.');
    }
  };

  const handleQuickDemoLogin = async () => {
    setEmail('admin@emergency.org');
    setPassword('AdminPassword123!');
    setErrorMsg(null);
    setSubmitting(true);
    const res = await login('admin@emergency.org', 'AdminPassword123!', 'admin');
    setSubmitting(false);
    if (res.success) {
      router.push('/admin');
    } else {
      setErrorMsg(res.error || 'Access Denied.');
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Public Emergency System</span>
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-500/50 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-950/60">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">
            Administrator Portal
          </h1>
          <p className="text-xs text-slate-400">
            Protected management hub. Authorization required to access emergency control dashboard.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-red-950/80 border border-red-500/50 text-red-200 text-xs rounded-xl flex items-start gap-2 shadow">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 uppercase">Admin Email / Username</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@emergency.org"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 uppercase">Secret Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black py-3.5 rounded-xl text-sm transition-all shadow-xl shadow-amber-950/60 flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Verifying Authorization...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>SIGN IN TO ADMIN DASHBOARD</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800 space-y-2">
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            className="w-full p-3.5 bg-gradient-to-r from-amber-950/80 to-slate-900 hover:from-amber-900/90 hover:to-slate-800 border-2 border-amber-500/50 rounded-2xl text-left flex items-center justify-between text-amber-300 font-bold text-xs transition shadow-lg shadow-amber-950/40"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">⚡</span>
              <span>1-Click Instant Evaluator Demo Login</span>
            </div>
            <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded font-black uppercase">
              Enter Hub
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
