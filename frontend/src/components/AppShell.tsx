'use client';

import React, { useState } from 'react';
import {
  Bell,
  Calculator,
  Infinity as InfinityIcon,
  LogOut,
  Menu,
  Settings,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type WorkspaceTab = 'solver' | 'settings';

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
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col md:flex-row antialiased select-none">

      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center text-[#00a8ff]">
            <InfinityIcon className="w-5 h-5 text-[#00a8ff]" />
          </div>
          <span className="font-extrabold text-base text-slate-900">
            Infinix <span className="text-[#00a8ff]">Math</span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl text-slate-600 bg-slate-50 border border-slate-200 hover:text-slate-900 cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation (Desktop + Mobile Drawer) */}
      <aside
        className={`${
          mobileMenuOpen ? 'flex' : 'hidden'
        } md:flex flex-col justify-between fixed md:sticky top-0 h-screen z-50 bg-white border-r border-slate-200/90 w-64 p-5 shadow-xs transition-all`}
      >
        <div className="space-y-6">
          {/* Logo & Brand Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center text-[#00a8ff] shadow-xs">
                <InfinityIcon className="w-5 h-5 text-[#00a8ff]" />
              </div>
              <span className="font-black text-xl tracking-tight text-slate-900">
                Infinix <span className="text-[#00a8ff]">Math</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links: ONLY Solver and Settings */}
          <nav className="space-y-2">
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
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#e0f2fe] text-[#00a8ff] border border-[#bae6fd] shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#00a8ff]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout at Bottom */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-9 h-9 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center text-[#00a8ff] shadow-xs">
              <User className="w-4 h-4 text-[#00a8ff]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{user?.username || 'admin'}</p>
              <p className="text-[10px] text-slate-400 font-medium">Administrator</p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar for Desktop */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-30">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Workspace &bull; <span className="text-[#00a8ff] font-bold capitalize">{currentTab}</span>
          </div>

          <div className="flex items-center gap-3">
            <div
              title="Notifications"
              className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-600 hover:border-sky-300 transition-colors cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-slate-600" />
            </div>

            <div
              title={`Logged in as ${user?.username || 'admin'}`}
              className="w-8 h-8 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center text-[#00a8ff] shadow-xs"
            >
              <User className="w-3.5 h-3.5 text-[#00a8ff]" />
            </div>
          </div>
        </header>

        {/* Main Content Page View */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppShell;
