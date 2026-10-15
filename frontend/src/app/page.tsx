'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Infinity as InfinityIcon,
  Loader2,
  Sparkles,
  TrendingUp,
  Wifi,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AppShell, { WorkspaceTab } from '../components/AppShell';
import SolverWorkspace from '../components/SolverWorkspace';
import { checkBackendHealth, getApiBaseUrl, setApiBaseUrl } from '../lib/api';

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('solver');

  // Backend connection settings state
  const [serverUrlInput, setServerUrlInput] = useState('');
  const [connStatus, setConnStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle');
  const [connMessage, setConnMessage] = useState<string | null>(null);

  useEffect(() => {
    setServerUrlInput(getApiBaseUrl());
  }, []);

  const handleTestAndSaveConnection = async () => {
    setConnStatus('testing');
    setConnMessage(null);
    const target = serverUrlInput.trim();
    setApiBaseUrl(target);
    try {
      const health = await checkBackendHealth();
      if (health.status === 'healthy' || health.service) {
        setConnStatus('connected');
        setConnMessage(`Successfully connected to ${target || 'default'}! CAS Engine is live.`);
      } else {
        setConnStatus('error');
        setConnMessage('Server reached, but reported status is offline.');
      }
    } catch (err: unknown) {
      setConnStatus('error');
      setConnMessage(
        err instanceof Error ? err.message : 'Could not reach server. Verify IP and port.'
      );
    }
  };

  // Route protection: redirect to /login if unauthenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Loading skeleton while checking authentication state
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4 select-none">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-xl shadow-sky-500/20 border border-sky-200 bg-white p-2">
            <img src="/logo.png" alt="Infinix Math Logo" className="w-full h-full object-contain animate-pulse" />
          </div>
        </div>
        <div className="text-sm font-semibold text-slate-600 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
          <span>Loading Infinix Math Workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <AppShell currentTab={activeTab} onTabChange={setActiveTab}>
      {/* View: Solver Workspace matching Figure 2 */}
      {activeTab === 'solver' && <SolverWorkspace />}



      {/* View: Settings */}
      {activeTab === 'settings' && (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-2xl font-bold text-slate-900">Account & Preferences</h2>
            <p className="text-xs text-slate-500">Configure application appearance and calculation preferences.</p>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
              <h3 className="text-sm font-semibold text-slate-800">User Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500">Username:</span>
                  <div className="font-mono text-slate-800 font-semibold mt-1">{user?.username || 'admin'}</div>
                </div>
                <div>
                  <span className="text-slate-500">Role:</span>
                  <div className="text-sky-600 font-semibold mt-1">{user?.role || 'Administrator'}</div>
                </div>
                <div>
                  <span className="text-slate-500">Subscription Tier:</span>
                  <div className="text-emerald-600 font-semibold mt-1">{user?.plan || 'Prime Pro'} (Active)</div>
                </div>
                <div>
                  <span className="text-slate-500">Authentication Method:</span>
                  <div className="text-slate-700 mt-1">Static Development Build (admin / admin)</div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
              <h3 className="text-sm font-semibold text-slate-800">Mathematical Engine Preferences</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-600 block mb-1.5 font-medium">Angle Unit:</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none focus:border-sky-500">
                    <option>Radians (rad)</option>
                    <option>Degrees (°)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 block mb-1.5 font-medium">Decimal Precision:</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 outline-none focus:border-sky-500">
                    <option>6 Decimal Places</option>
                    <option>4 Decimal Places</option>
                    <option>8 Decimal Places</option>
                    <option>10 Decimal Places</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Backend Server Configuration (Mobile / Desktop) */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-sky-600" />
                    <span>Backend Server Connection</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure the Python FastAPI / SymPy server URL. Required for mobile APK to connect to your computer.
                  </p>
                </div>
                {connStatus === 'connected' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Connected</span>
                  </span>
                )}
                {connStatus === 'error' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                    <XCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Unreachable</span>
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={serverUrlInput}
                    onChange={(e) => setServerUrlInput(e.target.value)}
                    placeholder="http://10.114.172.74:8000"
                    className="flex-1 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl px-3 py-2 text-xs font-mono text-slate-800 outline-none transition-all"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleTestAndSaveConnection}
                      disabled={connStatus === 'testing'}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md shadow-sky-500/20 active:scale-95"
                    >
                      {connStatus === 'testing' ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Testing...</span>
                        </>
                      ) : (
                        <span>Save & Test</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setServerUrlInput('http://10.114.172.74:8000');
                        setApiBaseUrl('http://10.114.172.74:8000');
                        handleTestAndSaveConnection();
                      }}
                      title="Set to your computer's local Wi-Fi IP"
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shrink-0 active:scale-95"
                    >
                      Use PC Wi-Fi IP
                    </button>
                  </div>
                </div>

                {connMessage && (
                  <div
                    className={`text-xs p-2.5 rounded-xl border ${
                      connStatus === 'connected'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium'
                        : 'bg-amber-50 border-amber-200 text-amber-800 font-medium'
                    }`}
                  >
                    {connMessage}
                  </div>
                )}

                <div className="text-[11px] text-slate-500 space-y-1 pt-2 border-t border-slate-200 leading-relaxed">
                  <p>
                    💡 <strong>Phone Setup:</strong> Connect phone to the same Wi-Fi as your computer, then tap <strong>&ldquo;Use PC Wi-Fi IP&rdquo;</strong> (<code className="text-sky-700 font-mono font-semibold">http://10.114.172.74:8000</code>).
                  </p>
                  <p>
                    ⚡ <strong>On-Device Offline Mode:</strong> If disconnected, Infinix Math automatically computes solutions locally on your phone without showing errors!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
