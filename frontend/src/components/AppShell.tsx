'use client';

import React, { useState } from 'react';
import {
  Bell,
  Calculator,
  GraduationCap,
  Infinity as InfinityIcon,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  TrendingUp,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type WorkspaceTab =
  | 'solver'
  | 'tutor'
  | 'graphing'
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const NAV_ITEMS: { id: WorkspaceTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'solver', label: 'Solver', icon: Calculator },
    { id: 'tutor', label: 'AI Tutor', icon: GraduationCap },
    { id: 'graphing', label: 'Graphing', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col antialiased select-none">
      {/* Top Header Navigation matching Concept B */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center text-[#00a8ff] shadow-xs">
              <InfinityIcon className="w-5 h-5 text-[#00a8ff]" />
            </div>
            <span className="font-black text-lg sm:text-xl tracking-tight text-slate-900">
              Infinix <span className="text-[#00a8ff]">Math</span>
            </span>
          </div>

          {/* Center: Floating Pill Navigation (Concept B) */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 bg-slate-50/90 border border-slate-200/80 rounded-full shadow-inner">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#00a8ff] text-white shadow-md shadow-sky-400/30'
                      : 'text-slate-600 hover:text-sky-600 hover:bg-white'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right: User Profile & Actions */}
          <div className="flex items-center gap-2.5">
            {/* User Avatar Circle */}
            <div
              title={`Logged in as ${user?.username || 'admin'}`}
              className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-700 cursor-pointer hover:border-sky-300 transition-colors"
            >
              <User className="w-4 h-4 text-slate-600" />
            </div>

            {/* Notification Bell Circle */}
            <div
              title="Notifications"
              className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-700 cursor-pointer hover:border-sky-300 transition-colors"
            >
              <Bell className="w-4 h-4 text-slate-600" />
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={logout}
              title="Sign Out"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 py-3 bg-white border-b border-slate-200 space-y-1 shadow-md">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onTabChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#00a8ff] text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
};

export default AppShell;
