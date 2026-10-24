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

  const [collapsed, setCollapsed] = useState(false);
  const [historyItems, setHistoryItems] = useState<string[]>([
    '5x^2 + 9x + 1 = 0',
    'x - 3 = x^2 + 29',
    '2x^2 + 5x - 3 = 0',
  ]);

  // Load history from localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('infinix_solve_history');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setHistoryItems(parsed.slice(0, 8));
          }
        }
      } catch {
        // ignore
      }

      // Listen for new history events
      const handleStorageUpdate = () => {
        try {
          const raw = localStorage.getItem('infinix_solve_history');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) setHistoryItems(parsed.slice(0, 8));
          }
        } catch {}
      };
      window.addEventListener('infinix_history_updated', handleStorageUpdate);
      return () => window.removeEventListener('infinix_history_updated', handleStorageUpdate);
    }
  }, []);

  const selectHistoryItem = (equation: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('infinix_load_equation', { detail: equation }));
    }
    onTabChange('solver');
    setMobileMenuOpen(false);
  };

  const NAV_ITEMS: { id: WorkspaceTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'solver', label: 'Math Solver', icon: Calculator },
    { id: 'settings', label: 'Settings & Tools', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col md:flex-row antialiased select-none">

      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-[#00a8ff]">
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

      {/* Sidebar Navigation (Desktop + Mobile Drawer matching Mathos AI) */}
      <aside
        className={`${
          mobileMenuOpen ? 'flex' : 'hidden'
        } md:flex flex-col justify-between fixed md:sticky top-0 h-screen z-50 bg-white border-r border-slate-200/90 ${
          collapsed ? 'w-20' : 'w-64'
        } p-4 shadow-xs transition-all duration-200 select-none`}
      >
        <div className="space-y-5 overflow-y-auto pr-1">
          {/* Logo & Brand Header with << Collapse Toggle */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00a8ff] to-[#38bdf8] flex items-center justify-center text-white shadow-md shadow-sky-500/20 shrink-0">
                <InfinityIcon className="w-5 h-5 text-white" />
              </div>
              {!collapsed && (
                <span className="font-black text-xl tracking-tight text-slate-900 truncate">
                  Infinix <span className="text-[#00a8ff]">Math</span>
                </span>
              )}
            </div>

            {/* Desktop Collapse Button */}
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  type="button"
                  title={collapsed ? item.label : undefined}
                  onClick={() => {
                    onTabChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-3.5'} py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#e0f2fe] text-[#00a8ff] border border-[#bae6fd] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#00a8ff]' : 'text-slate-400'}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* History Section: "Today" (Mathos AI Feature) */}
          {!collapsed && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2">
                <span>Today</span>
              </div>

              <div className="space-y-1">
                {historyItems.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectHistoryItem(item)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-sky-50/80 hover:text-[#00a8ff] transition-all truncate block cursor-pointer border border-transparent hover:border-sky-100"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Card & Logout at Bottom */}
        <div className="pt-3 border-t border-slate-100 space-y-2.5">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5 px-2'} py-1`}>
            <div className="w-8 h-8 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center text-[#00a8ff] shadow-xs shrink-0">
              <User className="w-4 h-4 text-[#00a8ff]" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{user?.username || 'Student'}</p>
                <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Pro Plan Live
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={logout}
            title={collapsed ? 'Sign Out' : undefined}
            className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-2 px-3'} py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer`}
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
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
