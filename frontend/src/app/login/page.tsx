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
  Mail,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 bg-[#f8fafc] antialiased select-none">
      {/* Background Subtle Gradient Spheres */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-sky-200/30 blur-[130px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-200/25 blur-[130px] pointer-events-none" />

      {/* Main 2-Column Container matching Concept B exactly */}
      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center justify-center">

        {/* Left Column: Concept B 3D Glass Art Banner */}
        <div className="relative hidden lg:block w-full h-[580px] rounded-3xl overflow-hidden shadow-2xl shadow-sky-950/10 border border-sky-100 bg-sky-100/50">
          <img
            src="/login_concept_b.jpg"
            alt="Infinix Math 3D Glass Visual"
            className="w-full h-full object-cover object-left"
          />
        </div>

        {/* Right Column: Clean White Login Card matching Concept B */}
        <div className="w-full max-w-md mx-auto bg-white rounded-3xl p-8 sm:p-10 shadow-2xl shadow-sky-900/10 border border-slate-100 flex flex-col justify-center">

          {/* Logo & Brand Header */}
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-500 shadow-sm">
              <InfinityIcon className="w-6 h-6 text-[#00a8ff]" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              Infinix <span className="text-[#00a8ff]">Math</span>
            </span>
          </div>

          {/* Title & Subtitle */}
          <div className="text-center space-y-1 mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal">
              Log in to continue your learning journey
            </p>
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="mb-5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username / Email Field */}
            <div className="relative flex items-center">
              <div className="absolute left-4 text-slate-400 pointer-events-none">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Email or Username"
                autoComplete="username"
                required
                className="w-full pl-11 pr-4 py-3.5 bg-[#f0f9ff] border border-[#bae6fd] focus:border-[#00a8ff] focus:bg-white rounded-full text-slate-900 text-sm placeholder-slate-400 outline-none transition-all shadow-inner"
              />
            </div>

            {/* Password Field */}
            <div className="relative flex items-center">
              <div className="absolute left-4 text-slate-400 pointer-events-none">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                required
                className="w-full pl-11 pr-11 py-3.5 bg-[#f0f9ff] border border-[#bae6fd] focus:border-[#00a8ff] focus:bg-white rounded-full text-slate-900 text-sm placeholder-slate-400 outline-none transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="btn-login-submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3.5 rounded-full bg-[#00a8ff] hover:bg-[#0096e6] text-white font-bold text-sm tracking-wider uppercase shadow-lg shadow-sky-400/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging In...</span>
                </>
              ) : (
                <>
                  <span>LOG IN</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Links */}
          <div className="text-center space-y-2 mt-4">
            <button
              type="button"
              onClick={() => setErrorMsg("Static password for development is 'admin'")}
              className="text-xs text-[#00a8ff] hover:underline font-semibold block mx-auto cursor-pointer"
            >
              Forgot Password?
            </button>
            <div className="text-xs text-slate-500">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={handleQuickFill}
                className="text-[#00a8ff] hover:underline font-semibold cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="mt-6 mb-4 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[11px] text-slate-400 font-medium">Or continue with</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Circular Social Buttons */}
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleQuickFill}
              title="Sign in with Google"
              className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm flex items-center justify-center shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <span className="text-red-500">G</span>
            </button>
            <button
              type="button"
              onClick={handleQuickFill}
              title="Sign in with Apple"
              className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 font-bold text-base flex items-center justify-center shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              
            </button>
            <button
              type="button"
              onClick={handleQuickFill}
              title="Sign in with Microsoft"
              className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-sky-600 font-bold text-sm flex items-center justify-center shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              ⊞
            </button>
          </div>

          {/* Quick-fill Chip for dev ease */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={handleQuickFill}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#0284c7] text-[11px] font-mono transition-all cursor-pointer"
            >
              <KeyRound className="w-3 h-3 text-[#00a8ff]" />
              <span>Demo login: admin / admin</span>
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400">
            Infinix Math &copy; 2024 &bull; Privacy Policy &bull; Terms of Service
          </div>
        </div>
      </div>
    </div>
  );
}
