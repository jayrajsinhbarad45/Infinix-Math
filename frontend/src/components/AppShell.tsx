'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Calculator,
  ChevronLeft,
  ChevronRight,
  FileText,
  GraduationCap,
  Grid3X3,
  Infinity as InfinityIcon,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type WorkspaceTab =
  | 'solver'
  | 'tutor'
  | 'pdf_helper'
  | 'graphing'
  | 'calculators'
  | 'notebooks'
  | 'settings';

interface AppShellProps {
  currentTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentTab,
  onTabChange,
  children,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const NAV_ITEMS: { id: WorkspaceTab; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    { id: 'solver', label: 'Solver', icon: Calculator },
    { id: 'tutor', label: 'AI Tutor', icon: GraduationCap, badge: 'Socratic' },
    { id: 'pdf_helper', label: 'PDF Helper', icon: FileText, badge: 'Phase 4' },
    { id: 'graphing', label: 'Graphing', icon: TrendingUp, badge: '2D / 3D' },
    { id: 'calculators', label: 'Calculators', icon: Grid3X3, badge: '45+' },
    { id: 'notebooks', label: 'Notebooks', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col md:flex-row antialiased">
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white/95 border-b border-slate-200/90 sticky top-0 z-40 backdrop-blur-xl shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 via-sky-600 to-blue-600 p-[1.5px] shadow-md shadow-sky-500/20">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center text-sky-600">
              <InfinityIcon className="w-4 h-4 text-sky-600" />
            </div>
          </div>
          <span className="font-bold text-base bg-gradient-to-r from-slate-900 to-sky-950 bg-clip-text text-transparent">
            Infinix Math
          </span>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:flex flex-col justify-between fixed md:sticky top-0 h-screen z-50 bg-white/95 border-r border-slate-200/90 backdrop-blur-2xl transition-all duration-300 ease-in-out shadow-xs ${
          isCollapsed ? 'md:w-20' : 'md:w-64'
        } w-64`}
      >
        {/* Top: Brand Header & Collapser */}
        <div>
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 shrink-0 rounded-xl overflow-hidden shadow-md shadow-sky-500/20 border border-sky-200 bg-white">
                <img src="/logo.png" alt="Infinix Math Logo" className="w-full h-full object-cover" />
              </div>
              {!isCollapsed && (
                <div className="whitespace-nowrap">
                  <span className="font-bold text-base tracking-tight bg-gradient-to-r from-slate-900 via-sky-950 to-blue-900 bg-clip-text text-transparent">
                    Infinix Math AI
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-600">
                      AI Math Engine
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  type="button"
                  onClick={() => {
                    onTabChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all group ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-50 to-blue-50/70 text-sky-700 border border-sky-200 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-sky-600' : 'text-slate-400 group-hover:text-sky-600'
                    }`}
                  />
                  {!isCollapsed && (
                    <div className="flex-1 flex items-center justify-between text-left">
                      <span>{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            isActive
                              ? 'bg-sky-200/60 text-sky-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom: User Profile & Logout */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/60">
          <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 shrink-0 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center font-bold text-xs text-white shadow-md">
                AD
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-slate-800 truncate">
                    {user?.name || 'Admin User'}
                  </div>
                  <div className="text-[10px] text-sky-600 font-medium truncate flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-sky-600" />
                    <span>Prime Pro • Active</span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-200/80 bg-white/70 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-500">
              Workspace &gt;{' '}
              <span className="text-slate-900 font-bold capitalize">
                {currentTab.replace('_', ' ')}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Live SymPy CAS Engine Status */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="hidden sm:inline">SymPy CAS Engine Live</span>
              <span className="sm:hidden">Live</span>
            </div>

            {/* GitHub Link */}
            <a
              href="https://github.com/jayrajsinhbarad45/Infinix-Math"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-white shadow-xs transition-colors"
              title="GitHub Repository"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppShell;
