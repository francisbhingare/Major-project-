'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { EmergencyReport, EmergencySeverity, EmergencyStatus } from '@/types/emergency';
import {
  ShieldAlert,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Users,
  Hospital as HospitalIcon,
  LogOut,
  Sparkles,
  BarChart3,
  PieChart,
  Eye,
  RefreshCw,
  X,
  MapPin,
  Phone,
  FileText,
  Play,
  Layers,
  ChevronRight
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, isAdmin, logout } = useAuth();

  // Active Admin Tab: 'INCIDENTS' | 'ANALYTICS' | 'USERS' | 'HOSPITALS' | 'DEMO_SCENARIOS'
  const [activeTab, setActiveTab] = useState<'INCIDENTS' | 'ANALYTICS' | 'USERS' | 'HOSPITALS' | 'DEMO_SCENARIOS'>('INCIDENTS');

  // Data States
  const [emergencies, setEmergencies] = useState<EmergencyReport[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedIncident, setSelectedIncident] = useState<EmergencyReport | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // Demo Runner State
  const [runningDemoId, setRunningDemoId] = useState<string | null>(null);

  // Route Guard: Require Admin
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth');
      } else if (!isAdmin) {
        // If logged in as normal user, show access denied notice or redirect to /user
      }
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  const loadAdminData = async () => {
    setLoadingData(true);
    try {
      // 1. Fetch emergencies
      const resEm = await fetch('/api/emergency/history');
      const dataEm = await resEm.json();
      if (dataEm.success) {
        const list = dataEm.emergencies || dataEm.reports || [];
        setEmergencies(list);
      }

      // 2. Fetch registered users
      const resUsr = await fetch('/api/admin/users');
      const dataUsr = await resUsr.json();
      if (dataUsr.success && dataUsr.users) {
        setUsersList(dataUsr.users);
      }
    } catch (err) {
      console.warn('[ADMIN] Data load failed:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadAdminData();
      // Auto-refresh every 6 seconds to capture live incoming reports
      const interval = setInterval(() => {
        fetch('/api/emergency/history')
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              setEmergencies(data.emergencies || data.reports || []);
            }
          })
          .catch(() => {});
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, isAdmin, activeTab]);

  const handleUpdateStatus = async (id: string, newStatus: EmergencyStatus) => {
    setUpdatingStatusId(id);
    try {
      const res = await fetch(`/api/emergency/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success && data.report) {
        setEmergencies((prev) =>
          prev.map((e) => (e.id === id ? data.report : e))
        );
        if (selectedIncident?.id === id) {
          setSelectedIncident(data.report);
        }
      }
    } catch (e) {
      // Handle error
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const runDemoScenario = async (scenario: any) => {
    setRunningDemoId(scenario.id);
    try {
      const aiRes = await fetch('/api/emergency/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: scenario.description,
          people_affected: scenario.people,
        }),
      });
      const aiData = await aiRes.json();

      const createRes = await fetch('/api/emergency/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emergency_type: scenario.type,
          description: scenario.description,
          people_affected: scenario.people,
          location: {
            latitude: 18.5204,
            longitude: 73.8567,
            accuracy: 10,
            address: 'City Center Presentation Telemetry',
            timestamp: new Date().toISOString(),
          },
          ai_assessment: aiData.assessment,
        }),
      });

      const createData = await createRes.json();
      if (createData.success) {
        loadAdminData();
        setActiveTab('INCIDENTS');
      }
    } catch (err) {
      // Handle error
    } finally {
      setRunningDemoId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl text-xs font-bold text-white shadow-xl">
          <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
          <span>Verifying Administrator Authorization...</span>
        </div>
      </div>
    );
  }

  // Access Denied Screen for Non-Admin Users
  if (isAuthenticated && !isAdmin) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-6">
        <div className="p-8 bg-slate-900 border-2 border-red-500/60 rounded-3xl space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-red-600/20 text-red-500 border border-red-500/40 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8 animate-bounce" />
          </div>
          <h2 className="text-2xl font-black text-white">ACCESS DENIED — ADMIN PRIVILEGES REQUIRED</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your logged-in account (<strong>{user?.email}</strong>) has the <strong>USER</strong> role. Access to the Admin Command Hub is restricted to Administrators only.
          </p>

          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/user"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-3 rounded-xl transition shadow"
            >
              Go to User Dashboard →
            </Link>
            <button
              onClick={logout}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-5 py-3 rounded-xl transition"
            >
              Logout & Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  // Filter Computation
  const filteredEmergencies = emergencies.filter((e) => {
    const matchesQuery =
      searchQuery === '' ||
      e.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.report_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.emergency_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.location?.address && e.location.address.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSeverity = severityFilter === 'ALL' || e.severity === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;

    return matchesQuery && matchesSeverity && matchesStatus;
  });

  // Calculate Metrics
  const totalIncidents = emergencies.length;
  const activeIncidents = emergencies.filter((e) => e.status !== 'RESOLVED').length;
  const criticalIncidents = emergencies.filter((e) => e.severity === 'CRITICAL' || e.severity === 'HIGH').length;
  const resolvedIncidents = emergencies.filter((e) => e.status === 'RESOLVED').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-950 border border-amber-500/40 p-6 sm:p-8 rounded-3xl space-y-4 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-400 flex items-center justify-center font-black shadow-lg shadow-amber-950/60">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white">EMERGENCY ADMIN DASHBOARD</h1>
                <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded border border-amber-400 uppercase">
                  ADMIN COMMAND
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono mt-0.5">Logged in as {user.email} (System Admin)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/system-diagnostics"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition shadow"
            >
              <Activity className="w-4 h-4" />
              <span>System Diagnostics</span>
            </Link>

            <button
              onClick={logout}
              className="bg-red-950/80 hover:bg-red-900 text-red-300 font-bold text-xs px-3.5 py-2 rounded-xl border border-red-500/30 flex items-center gap-1.5 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* 4 CORE DASHBOARD METRIC CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 shadow">
            <span className="text-slate-400 text-[11px] block uppercase font-bold">Total Emergency Incidents</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-white">{totalIncidents}</span>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded">All Reports</span>
            </div>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-2xl border border-blue-500/30 shadow">
            <span className="text-blue-400 text-[11px] block uppercase font-bold">Active Emergencies</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-blue-400">{activeIncidents}</span>
              <span className="text-[10px] font-bold text-blue-300 bg-blue-950 px-2 py-0.5 rounded border border-blue-500/30">In Response</span>
            </div>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-2xl border border-red-500/30 shadow">
            <span className="text-red-400 text-[11px] block uppercase font-bold">Critical / High Severity</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-red-400">{criticalIncidents}</span>
              <span className="text-[10px] font-bold text-red-300 bg-red-950 px-2 py-0.5 rounded border border-red-500/30">Priority Triage</span>
            </div>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-2xl border border-emerald-500/30 shadow">
            <span className="text-emerald-400 text-[11px] block uppercase font-bold">Resolved Incidents</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-emerald-400">{resolvedIncidents}</span>
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">Completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto text-xs font-bold">
        {[
          { id: 'INCIDENTS', label: `Emergency Incidents (${totalIncidents})`, icon: ShieldAlert },
          { id: 'ANALYTICS', label: 'Trends & Severity Analytics', icon: BarChart3 },
          { id: 'USERS', label: `User Management (${usersList.length})`, icon: Users },
          { id: 'HOSPITALS', label: 'Hospital Network', icon: HospitalIcon },
          { id: 'DEMO_SCENARIOS', label: 'Preset Scenarios', icon: Play },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-black shadow border border-amber-400'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: INCIDENT MANAGEMENT TABLE */}
      {activeTab === 'INCIDENTS' && (
        <div className="space-y-4">
          {/* Controls Bar: Search & Filters */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="md:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID, Category, Description, Address..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 font-bold"
              >
                <option value="ALL">Severity: ALL</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MODERATE">MODERATE</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 font-bold"
              >
                <option value="ALL">Status: ALL</option>
                <option value="NEW">NEW</option>
                <option value="ANALYZING">ANALYZING</option>
                <option value="HOSPITAL_RECOMMENDED">HOSPITAL_RECOMMENDED</option>
                <option value="ALERT_SENT">ALERT_SENT</option>
                <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                <option value="IN_RESPONSE">IN_RESPONSE</option>
                <option value="RESOLVED">RESOLVED</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-4">Incident ID</th>
                    <th className="p-4">Category & Description</th>
                    <th className="p-4">Severity</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">GPS Location</th>
                    <th className="p-4">Time</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredEmergencies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                        No emergency incidents found matching your search filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredEmergencies.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-4 font-mono font-bold text-white whitespace-nowrap">
                          {emp.report_id}
                        </td>
                        <td className="p-4 max-w-xs">
                          <span className="font-bold text-white block">{emp.emergency_type}</span>
                          <p className="text-slate-400 text-[11px] truncate">{emp.description}</p>
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase border ${
                            emp.severity === 'CRITICAL' ? 'bg-red-950 text-red-300 border-red-500/40' :
                            emp.severity === 'HIGH' ? 'bg-amber-950 text-amber-300 border-amber-500/40' :
                            'bg-blue-950 text-blue-300 border-blue-500/40'
                          }`}>
                            {emp.severity}
                          </span>
                        </td>
                        <td className="p-4">
                          <select
                            value={emp.status}
                            onChange={(e) => handleUpdateStatus(emp.id, e.target.value as EmergencyStatus)}
                            disabled={updatingStatusId === emp.id}
                            className="bg-slate-950 border border-slate-800 text-xs text-white rounded-lg p-1.5 font-mono focus:ring-1 focus:ring-amber-500"
                          >
                            <option value="NEW">NEW</option>
                            <option value="ANALYZING">ANALYZING</option>
                            <option value="HOSPITAL_RECOMMENDED">HOSPITAL_RECOMMENDED</option>
                            <option value="ALERT_SENT">ALERT_SENT</option>
                            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                            <option value="IN_RESPONSE">IN_RESPONSE</option>
                            <option value="RESOLVED">RESOLVED</option>
                          </select>
                        </td>
                        <td className="p-4 font-mono text-[11px] text-slate-400">
                          {emp.location?.address || `${emp.location?.latitude.toFixed(4)}, ${emp.location?.longitude.toFixed(4)}`}
                        </td>
                        <td className="p-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {new Date(emp.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedIncident(emp)}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] inline-flex items-center gap-1 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ANALYTICS & TRENDS */}
      {activeTab === 'ANALYTICS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chart 1: Severity Distribution */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-400" />
              <span>Incident Severity Distribution</span>
            </h3>

            <div className="space-y-3 pt-2">
              {[
                { label: 'CRITICAL', count: emergencies.filter((e) => e.severity === 'CRITICAL').length, color: 'bg-red-500' },
                { label: 'HIGH', count: emergencies.filter((e) => e.severity === 'HIGH').length, color: 'bg-amber-500' },
                { label: 'MODERATE', count: emergencies.filter((e) => e.severity === 'MODERATE').length, color: 'bg-blue-500' },
                { label: 'LOW', count: emergencies.filter((e) => e.severity === 'LOW').length, color: 'bg-emerald-500' },
              ].map((item) => {
                const percentage = totalIncidents > 0 ? Math.round((item.count / totalIncidents) * 100) : 0;
                return (
                  <div key={item.label} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-300">{item.label}</span>
                      <span className="text-white font-mono">{item.count} ({percentage}%)</span>
                    </div>
                    <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div className={`h-full ${item.color} transition-all duration-500`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart 2: Category Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              <span>Emergency Incident Categories</span>
            </h3>

            <div className="space-y-3 pt-2">
              {['Road Accident', 'Chest Pain', 'Fire', 'Unconscious Person', 'Injury'].map((cat) => {
                const count = emergencies.filter((e) => e.emergency_type === cat).length;
                const percentage = totalIncidents > 0 ? Math.round((count / totalIncidents) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-300">{cat}</span>
                      <span className="text-white font-mono">{count} incidents</span>
                    </div>
                    <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: USER MANAGEMENT */}
      {activeTab === 'USERS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Registered User Accounts ({usersList.length})</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">ROLE-BASED ACCOUNTS</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3">User ID</th>
                  <th className="p-3">Full Name</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Registered Date</th>
                  <th className="p-3">Last Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {usersList.map((usr) => (
                  <tr key={usr.id} className="hover:bg-slate-800/40">
                    <td className="p-3 text-slate-400">{usr.id}</td>
                    <td className="p-3 font-bold text-white">{usr.name}</td>
                    <td className="p-3 text-blue-400">{usr.email}</td>
                    <td className="p-3">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${
                        usr.role === 'admin' ? 'bg-amber-950 text-amber-300 border-amber-500/40' : 'bg-blue-950 text-blue-300 border-blue-500/40'
                      }`}>
                        {usr.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">{new Date(usr.created_at).toLocaleDateString()}</td>
                    <td className="p-3 text-slate-400">{usr.last_login ? new Date(usr.last_login).toLocaleString() : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: HOSPITALS NETWORK */}
      {activeTab === 'HOSPITALS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <HospitalIcon className="w-4 h-4 text-teal-400" />
              <span>Live OpenStreetMap Overpass Healthcare Network</span>
            </h3>
            <Link
              href="/admin/system-diagnostics"
              className="text-xs text-blue-400 hover:text-blue-300 underline font-bold"
            >
              Run Diagnostic Test →
            </Link>
          </div>
          <p className="text-xs text-slate-400">
            Real healthcare facilities queried live using Overpass QL around user GPS coordinates. Zero hardcoded mock data.
          </p>
        </div>
      )}

      {/* TAB 5: PRESET DEMO SCENARIOS */}
      {activeTab === 'DEMO_SCENARIOS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { id: 'scen-1', title: 'Road Accident — Critical', type: 'Road Accident', description: 'Multi-vehicle collision on highway. Two people injured, one unconscious with severe hemorrhage.', people: 2 },
            { id: 'scen-2', title: 'Chest Pain — Acute MI', type: 'Chest Pain', description: '65-year-old patient experiencing crushing retrosternal chest pain and cold sweats.', people: 1 },
            { id: 'scen-3', title: 'Building Fire — Severe Burns', type: 'Fire', description: 'Building fire with second-degree facial thermal burns and smoke inhalation.', people: 1 },
            { id: 'scen-4', title: 'Minor Injury — Laceration', type: 'Injury', description: 'Superficial forearm wound from glass cut. Patient conscious.', people: 1 },
          ].map((scen) => (
            <div key={scen.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow flex flex-col justify-between">
              <div className="space-y-1">
                <span className="font-bold text-white block text-sm">{scen.title}</span>
                <p className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  "{scen.description}"
                </p>
              </div>

              <button
                onClick={() => runDemoScenario(scen)}
                disabled={runningDemoId === scen.id}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 shadow"
              >
                {runningDemoId === scen.id ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing Scenario...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-slate-950" />
                    <span>[TRIGGER SCENARIO PIPELINE]</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* DETAILED INCIDENT INSPECTOR MODAL */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <h3 className="text-base font-black text-white">{selectedIncident.report_id}</h3>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="p-1 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">SEVERITY</span>
                  <span className="text-red-400 font-bold">{selectedIncident.severity}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">STATUS</span>
                  <span className="text-amber-400 font-bold">{selectedIncident.status}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-300 uppercase block text-[11px]">Description:</span>
                <p className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-white mt-1">
                  {selectedIncident.description}
                </p>
              </div>

              {selectedIncident.detailed_analysis && (
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <span className="font-bold text-amber-400 uppercase block text-[11px]">AI 31-Field Telemetry Breakdown:</span>
                  <ul className="space-y-1 text-slate-300 font-mono text-[11px]">
                    <li>• Primary Category: {selectedIncident.detailed_analysis.primary_incident_category}</li>
                    <li>• Red Flags: {selectedIncident.detailed_analysis.red_flags_detected.join(', ')}</li>
                    <li>• Dispatch Recommendation: {selectedIncident.detailed_analysis.dispatch_recommendations}</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between gap-2">
              <a
                href={`/api/reports/generate?id=${selectedIncident.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow uppercase tracking-wider"
              >
                <FileText className="w-4 h-4" />
                <span>Generate & Download PDF Report</span>
              </a>

              <button
                onClick={() => setSelectedIncident(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2 rounded-xl"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
