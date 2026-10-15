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
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-[#f8fafc] overflow-hidden select-none">
      {/* Ambient Math Background Graphics in Soft Sky Blue */}
      <div className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden text-sky-400/40 font-mono text-sm sm:text-base font-light">
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

      {/* Ambient Radial Sky Blue & Cyan Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-sky-200/50 via-cyan-100/40 to-blue-200/40 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-10 left-10 w-80 h-80 bg-sky-300/25 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-300/20 rounded-full blur-[110px] pointer-events-none" />

      {/* Elevated Crisp White Login Card */}
      <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-2xl border border-sky-100/80 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-sky-900/10 transition-all">
        {/* Glowing Brand Logo */}
        <div className="flex flex-col items-center text-center space-y-3 mb-8">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-500 rounded-2xl blur-md opacity-60 group-hover:opacity-100 transition duration-500" />
            <div className="relative w-16 h-16 rounded-2xl bg-white border border-sky-200 flex items-center justify-center shadow-md overflow-hidden">
              <img src="/logo.png" alt="Infinix Math Logo" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-sky-950 to-blue-900 bg-clip-text text-transparent">
              Welcome to Infinix Math
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Sign in to access your AI Math Workspace
            </p>
          </div>
        </div>

        {/* Error Notification Banner */}
        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username / Email */}
          <div className="space-y-2">
            <label
              htmlFor="login-username"
              className="block text-xs font-semibold text-slate-700 tracking-wide"
            >
              Username or Email
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-400 pointer-events-none">
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
                className="w-full pl-10 pr-4 py-3 bg-slate-50/80 border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 rounded-xl text-slate-800 text-sm font-medium placeholder-slate-400 outline-none transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-slate-700 tracking-wide"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setErrorMsg("Static password for development is 'admin'")}
                className="text-xs text-sky-600 hover:text-sky-700 font-medium transition-colors"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-400 pointer-events-none">
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
                className="w-full pl-10 pr-11 py-3 bg-slate-50/80 border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 rounded-xl text-slate-800 text-sm font-medium placeholder-slate-400 outline-none transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-slate-400 hover:text-slate-600 transition-colors"
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
                className="w-4 h-4 rounded bg-white border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
              />
              <span className="text-xs text-slate-600">Remember me</span>
            </label>

            <span className="text-[11px] text-slate-400">v1.0 • Concept B</span>
          </div>

          {/* Sign In Primary Button */}
          <button
            type="submit"
            id="btn-login-submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-600 hover:via-sky-700 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all cursor-pointer"
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

        {/* Social / Alternative Divider */}
        <div className="mt-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[11px] text-slate-400 font-medium">or continue with</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Social Sign-In Options */}
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={handleQuickFill}
            className="flex items-center justify-center py-2.5 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-xs font-semibold text-slate-700 transition-all cursor-pointer"
          >
            <span className="text-sky-600 font-bold mr-1.5">G</span> Google
          </button>
          <button
            type="button"
            onClick={handleQuickFill}
            className="flex items-center justify-center py-2.5 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-xs font-semibold text-slate-700 transition-all cursor-pointer"
          >
            <span className="text-slate-800 font-bold mr-1.5"></span> Apple
          </button>
          <button
            type="button"
            onClick={handleQuickFill}
            className="flex items-center justify-center py-2.5 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-xs font-semibold text-slate-700 transition-all cursor-pointer"
          >
            <span className="text-blue-500 font-bold mr-1.5">⊞</span> Microsoft
          </button>
        </div>

        {/* Development Credential Chip */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={handleQuickFill}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-xs font-mono transition-all cursor-pointer"
            title="Click to auto-fill static credentials"
          >
            <KeyRound className="w-3.5 h-3.5 text-sky-600" />
            <span>Development Build: admin / admin</span>
          </button>
        </div>
      </div>
    </div>
  );
}
