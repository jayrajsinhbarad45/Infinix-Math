'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  HelpCircle,
  Lightbulb,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { getTutorHint, verifyStudentStep } from '../lib/api';
import { StepVerificationResponse, TutorHintResponse } from '../lib/types';
import MathRenderer from './MathRenderer';
import MathToolbar from './MathToolbar';

const TUTOR_PRACTICE_PROBLEMS = [
  {
    title: 'Linear Equation',
    problem: '3x + 7 = 22',
    hintTarget: 'Subtract 7 from both sides, then divide by 3.',
  },
  {
    title: 'Quadratic Equation',
    problem: 'x^2 - 5x + 6 = 0',
    hintTarget: 'Factor into (x - 2)(x - 3) = 0 or use quadratic formula.',
  },
  {
    title: 'Polynomial Derivative',
    problem: '\\frac{d}{dx}(x^3 + 4x^2 - 5)',
    hintTarget: 'Apply the power rule d/dx(x^n) = n*x^(n-1) to each term.',
  },
  {
    title: 'Indefinite Integral',
    problem: '\\int (4x^3 + 2x) dx',
    hintTarget: 'Integrate term by term: x^4 + x^2 + C. Remember + C!',
  },
];

export const TutorMode: React.FC = () => {
  const [problem, setProblem] = useState(TUTOR_PRACTICE_PROBLEMS[0].problem);
  const [verifiedSteps, setVerifiedSteps] = useState<string[]>([]);
  const [proposedStep, setProposedStep] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [feedback, setFeedback] = useState<StepVerificationResponse | null>(null);
  const [hint, setHint] = useState<TutorHintResponse | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleVerify = async () => {
    if (!proposedStep.trim()) return;

    setIsVerifying(true);
    setFeedback(null);
    setHint(null);

    try {
      const res = await verifyStudentStep({
        problem: problem,
        previous_steps: verifiedSteps,
        proposed_step: proposedStep.trim(),
      });

      setFeedback(res);

      if (res.is_valid && res.status === 'correct') {
        setVerifiedSteps((prev) => [...prev, proposedStep.trim()]);
        setProposedStep('');
        if (res.is_final_step) {
          setIsCompleted(true);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Step verification failed';
      setFeedback({
        is_valid: false,
        status: 'incorrect_math',
        confidence: 0.0,
        evidence: `Error contacting tutor service: ${msg}`,
        is_symbolically_verified: false,
        is_final_step: false,
        execution_time_ms: 0,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFetchHint = async () => {
    setIsLoadingHint(true);
    try {
      const res = await getTutorHint({
        problem: problem,
        current_steps: verifiedSteps,
      });
      setHint(res);
    } catch {
      setHint({
        hint: 'Consider applying inverse operations to simplify both sides of the equation.',
        suggested_technique: 'Algebraic Simplification',
      });
    } finally {
      setIsLoadingHint(false);
    }
  };

  const resetProblem = (newProblem?: string) => {
    setProblem(newProblem ?? problem);
    setVerifiedSteps([]);
    setProposedStep('');
    setFeedback(null);
    setHint(null);
    setIsCompleted(false);
  };

  return (
    <div className="space-y-6">
      {/* Problem Selection Header */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Interactive AI Tutor Mode</h2>
              <p className="text-xs text-slate-400">Step-by-step student practice with real-time error diagnostics</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => resetProblem()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700/60"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restart</span>
          </button>
        </div>

        {/* Practice Problem Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
          <span className="text-xs text-slate-500 font-medium mr-1">Choose Challenge:</span>
          {TUTOR_PRACTICE_PROBLEMS.map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={() => resetProblem(item.problem)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                problem === item.problem
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-500/30'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/50'
              }`}
            >
              {item.title}
            </button>
          ))}
        </div>

        {/* Active Problem Display */}
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Current Problem to Solve:
            </span>
            <div className="text-lg text-indigo-100 mt-1">
              <MathRenderer content={`$$${problem}$$`} displayMode={false} />
            </div>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1 rounded-full shrink-0 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Live Grader Active
          </span>
        </div>
      </div>

      {/* Verified Derivations Progress */}
      {verifiedSteps.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Validated Student Steps ({verifiedSteps.length})</span>
          </div>

          <div className="space-y-2">
            {verifiedSteps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-emerald-950/20 border border-emerald-800/30 rounded-xl text-emerald-200"
              >
                <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-xs flex items-center justify-center font-bold">
                  {idx + 1}
                </span>
                <div className="flex-1 font-mono text-sm overflow-x-auto">
                  <MathRenderer content={`$$${step}$$`} displayMode={false} />
                </div>
                <span className="text-[10px] text-emerald-400/80 font-mono font-medium">Valid ✓</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completion Banner */}
      {isCompleted && (
        <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border border-emerald-600/50 rounded-3xl p-6 sm:p-8 text-center backdrop-blur-2xl shadow-xl shadow-emerald-900/20 space-y-3 animate-in fade-in duration-300">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Trophy className="w-6 h-6 animate-bounce" />
          </div>
          <h3 className="text-xl font-bold text-white">Problem Solved Successfully! 🎉</h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            You completed every step correctly. All mathematical transformations were verified deterministic by SymPy.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                const nextIdx = (TUTOR_PRACTICE_PROBLEMS.findIndex((p) => p.problem === problem) + 1) % TUTOR_PRACTICE_PROBLEMS.length;
                resetProblem(TUTOR_PRACTICE_PROBLEMS[nextIdx].problem);
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-emerald-600/30"
            >
              Try Next Problem
            </button>
          </div>
        </div>
      )}

      {/* Step Input Area (hidden when completed) */}
      {!isCompleted && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl shadow-black/50 space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="tutor-proposed-input" className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Your Next Derivation Step:
            </label>
            <span className="text-xs text-slate-400 font-mono">
              Step {verifiedSteps.length + 1}
            </span>
          </div>

          <div className="relative">
            <input
              id="tutor-proposed-input"
              type="text"
              value={proposedStep}
              onChange={(e) => setProposedStep(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleVerify();
                }
              }}
              placeholder="e.g. 3x = 15, or (x - 2)(x - 3) = 0"
              className="w-full bg-slate-950/90 border border-slate-700/80 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-2xl px-4 py-3 text-slate-100 font-mono text-base placeholder-slate-600 outline-none transition-all"
            />
          </div>

          {/* Quick-insert toolbar */}
          <MathToolbar onInsert={(snippet) => setProposedStep((prev) => prev + snippet)} />

          {/* Live input preview */}
          {proposedStep.trim() && (
            <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl text-xs text-slate-300 flex items-center gap-2">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Preview:</span>
              <div className="overflow-x-auto text-indigo-200">
                <MathRenderer content={`$$${proposedStep}$$`} displayMode={false} />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleFetchHint}
              disabled={isLoadingHint}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-300 hover:text-amber-200 bg-amber-950/30 hover:bg-amber-950/50 border border-amber-800/40 rounded-xl transition-colors disabled:opacity-50"
            >
              {isLoadingHint ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lightbulb className="w-3.5 h-3.5" />}
              <span>Need a Hint?</span>
            </button>

            <button
              type="button"
              id="btn-verify-student-step"
              onClick={handleVerify}
              disabled={isVerifying || !proposedStep.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-violet-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Step...</span>
                </>
              ) : (
                <>
                  <span>Verify Step</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Live Diagnostic Feedback Banner */}
      {feedback && (
        <div
          className={`border rounded-3xl p-6 backdrop-blur-xl transition-all animate-in fade-in duration-200 ${
            feedback.is_valid
              ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
              : 'bg-rose-950/25 border-rose-800/50 text-rose-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {feedback.is_valid ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-sm">
                  {feedback.is_valid ? 'Step Valid!' : 'Mathematical Error Detected'}
                </span>
                {feedback.error_code && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-rose-900/60 border border-rose-700/60 text-rose-200">
                    {feedback.error_code}
                  </span>
                )}
                <span className="text-[10px] font-mono text-slate-400 ml-auto">
                  {feedback.execution_time_ms} ms
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{feedback.evidence}</p>

              {feedback.suggested_correction && (
                <div className="p-3 bg-black/40 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Suggested Next Step:</span>
                  <div className="text-xs font-mono text-indigo-300">
                    <MathRenderer content={`$$${feedback.suggested_correction}$$`} displayMode={false} />
                  </div>
                </div>
              )}

              {feedback.pedagogical_hint && (
                <div className="flex items-start gap-1.5 text-xs text-amber-300/90 pt-1">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{feedback.pedagogical_hint}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Socratic Hint Drawer */}
      {hint && (
        <div className="bg-amber-950/20 border border-amber-800/40 rounded-3xl p-5 backdrop-blur-xl text-amber-200 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span>Tutor Scaffolding Hint:</span>
            {hint.suggested_technique && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-900/50 border border-amber-700/50 text-amber-300 font-mono">
                {hint.suggested_technique}
              </span>
            )}
          </div>
          <p className="text-xs text-amber-200/90 leading-relaxed pl-6">{hint.hint}</p>
        </div>
      )}
    </div>
  );
};

export default TutorMode;
