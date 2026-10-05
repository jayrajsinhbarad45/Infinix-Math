'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  FileText,
  Grid3X3,
  Infinity as InfinityIcon,
  Loader2,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AppShell, { WorkspaceTab } from '../components/AppShell';
import SolverWorkspace from '../components/SolverWorkspace';
import TutorMode from '../components/TutorMode';

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('solver');

  // Route protection: redirect to /login if unauthenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Loading skeleton while checking authentication state
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center space-y-4 select-none">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-fuchsia-600 p-[1.5px] shadow-xl shadow-indigo-500/30">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-indigo-400">
              <InfinityIcon className="w-8 h-8 text-indigo-400 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="text-sm font-semibold text-slate-400 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          <span>Loading Infinix Math Workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <AppShell currentTab={activeTab} onTabChange={setActiveTab}>
      {/* View: Solver Workspace matching Figure 2 */}
      {activeTab === 'solver' && <SolverWorkspace />}

      {/* View: AI Tutor Workspace matching Figure 3 */}
      {activeTab === 'tutor' && (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
          <TutorMode />
        </div>
      )}

      {/* View: PDF Homework Helper (Phase 4) */}
      {activeTab === 'pdf_helper' && (
        <div className="max-w-4xl mx-auto py-16 text-center space-y-6 animate-in fade-in duration-300">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phase 4 Module</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">PDF Homework Helper Workspace</h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              Upload multi-page textbook PDFs, use the bounding-box lasso tool to crop questions, and solve them side-by-side with full document annotation tools.
            </p>
          </div>
        </div>
      )}

      {/* View: Graphing Calculator (Phase 5) */}
      {activeTab === 'graphing' && (
        <div className="max-w-4xl mx-auto py-16 text-center space-y-6 animate-in fade-in duration-300">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phase 5 Module</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Interactive 2D & 3D Graphing Canvas</h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              Plot explicit, implicit, polar, and parametric functions. Inspect critical points, calculate tangent line slopes, and visualize 3D multivariable surfaces.
            </p>
          </div>
        </div>
      )}

      {/* View: 45+ Calculators (Phase 5) */}
      {activeTab === 'calculators' && (
        <div className="max-w-4xl mx-auto py-16 text-center space-y-6 animate-in fade-in duration-300">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Grid3X3 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phase 5 Module</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">45+ Specialized Subject Calculators</h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              Dedicated calculators for Fractions, Polynomial Factoring, Quadratic Equations, Derivatives, Integrals, Limits, Matrix RREF, Normal Distribution, and Physics.
            </p>
          </div>
        </div>
      )}

      {/* View: Notebooks & Study Suite (Phase 6) */}
      {activeTab === 'notebooks' && (
        <div className="max-w-4xl mx-auto py-16 text-center space-y-6 animate-in fade-in duration-300">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phase 6 Module</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Subject Notebooks & Study Suite</h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              Organize solved problems into class notebooks, generate digital flashcards automatically, and test yourself with adaptive diagnostic quizzes.
            </p>
          </div>
        </div>
      )}

      {/* View: Settings */}
      {activeTab === 'settings' && (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-2xl font-bold text-white">Account & Preferences</h2>
            <p className="text-xs text-slate-400">Configure application appearance and calculation preferences.</p>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 className="text-sm font-semibold text-slate-200">User Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500">Username:</span>
                  <div className="font-mono text-slate-200 mt-1">{user?.username || 'admin'}</div>
                </div>
                <div>
                  <span className="text-slate-500">Role:</span>
                  <div className="text-indigo-400 font-semibold mt-1">{user?.role || 'Administrator'}</div>
                </div>
                <div>
                  <span className="text-slate-500">Subscription Tier:</span>
                  <div className="text-emerald-400 font-semibold mt-1">{user?.plan || 'Prime Pro'} (Active)</div>
                </div>
                <div>
                  <span className="text-slate-500">Authentication Method:</span>
                  <div className="text-slate-300 mt-1">Static Development Build (admin / admin)</div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 className="text-sm font-semibold text-slate-200">Mathematical Engine Preferences</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1.5">Angle Unit:</label>
                  <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 outline-none">
                    <option>Radians (rad)</option>
                    <option>Degrees (°)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1.5">Decimal Precision:</label>
                  <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 outline-none">
                    <option>6 Decimal Places</option>
                    <option>4 Decimal Places</option>
                    <option>8 Decimal Places</option>
                    <option>10 Decimal Places</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
