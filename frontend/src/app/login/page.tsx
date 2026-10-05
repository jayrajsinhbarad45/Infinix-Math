'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Infinity as InfinityIcon,
  KeyRound,
  Loader2,
  Lock,
  Sparkles,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    setIsSubmitting(true);
    const res = await login(username, password);
    setIsSubmitting(false);

    if (res.success) {
      router.push('/');
    } else {
      setErrorMsg(res.error || 'Login failed.');
    }
  };

  const handleQuickFill = () => {
    setUsername('admin');
    setPassword('admin');
    setErrorMsg(null);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-[#070b14] overflow-hidden select-none">
      {/* Ambient Math Background Graphics */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden text-indigo-300/40 font-mono text-sm sm:text-base font-light">
        <span className="absolute top-[8%] left-[12%] animate-pulse">
          {'\u222B\u2080\u221E f(x) dx = E(X)'}
        </span>
        <span className="absolute top-[18%] right-[14%]">
          {'f(x) = (1 / \u221A(2\u03C0\u03C3\u00B2)) \u2022 e^(-(x-\u03BC)\u00B2 / 2\u03C3\u00B2)'}
        </span>
        <span className="absolute bottom-[24%] left-[8%]">
          {'e^(i\u03C0) + 1 = 0 (Euler\'s Identity)'}
        </span>
        <span className="absolute bottom-[12%] right-[16%] animate-pulse">
          {'\u2207 \u00D7 E = -\u2202B/\u2202t'}
        </span>
        <span className="absolute top-[45%] left-[4%]">
          {'lim [x \u2192 0] (sin x / x) = 1'}
        </span>
        <span className="absolute top-[52%] right-[6%]">
          {'\u2211 (1 / n\u00B2) = \u03C0\u00B2 / 6'}
        </span>
        <span className="absolute top-[75%] left-[22%]">
          {'d/dx [arcsin(x)] = 1 / \u221A(1 - x\u00B2)'}
        </span>
      </div>

      {/* Ambient Radial Gradient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-indigo-600/20 via-violet-600/15 to-fuchsia-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-10 left-10 w-72 h-72 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Glassmorphic Login Card */}
      <div className="relative z-10 w-full max-w-md bg-slate-900/65 backdrop-blur-2xl border border-slate-700/60 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-black/80 transition-all">
        {/* Glowing Shield Brand Logo */}
        <div className="flex flex-col items-center text-center space-y-3 mb-8">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 rounded-2xl blur-md opacity-70 group-hover:opacity-100 transition duration-500" />
            <div className="relative w-16 h-16 rounded-2xl bg-slate-950 border border-indigo-500/40 flex items-center justify-center shadow-inner">
              <InfinityIcon className="w-8 h-8 text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
              Welcome to Infinix Math
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              Sign in to access your AI Math Workspace
            </p>
          </div>
        </div>

        {/* Error Notification Banner */}
        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username / Email */}
          <div className="space-y-2">
            <label
              htmlFor="login-username"
              className="block text-xs font-semibold text-slate-300 tracking-wide"
            >
              Username or Email
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-500 pointer-events-none">
                <User className="w-4 h-4" />
              </div>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-slate-100 text-sm font-medium placeholder-slate-600 outline-none transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-slate-300 tracking-wide"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setErrorMsg("Static password for development is 'admin'")}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-500 pointer-events-none">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="w-full pl-10 pr-11 py-3 bg-slate-950/80 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-slate-100 text-sm font-medium placeholder-slate-600 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer"
              />
              <span className="text-xs text-slate-400">Remember me</span>
            </label>

            <span className="text-[11px] text-slate-500">v1.0 • Phase 1</span>
          </div>

          {/* Sign In Primary Button */}
          <button
            type="submit"
            id="btn-login-submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-600 to-fuchsia-600 hover:from-indigo-600 hover:via-violet-700 hover:to-fuchsia-700 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Development Credential Chip */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
          <button
            type="button"
            onClick={handleQuickFill}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 text-xs font-mono transition-all cursor-pointer"
            title="Click to auto-fill static credentials"
          >
            <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
            <span>Development Build: Use admin / admin</span>
          </button>
        </div>
      </div>
    </div>
  );
}
