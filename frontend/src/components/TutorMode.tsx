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
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl shadow-slate-200/50 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Interactive AI Tutor Mode</h2>
              <p className="text-xs text-slate-500">Step-by-step student practice with real-time error diagnostics</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => resetProblem()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restart</span>
          </button>
        </div>

        {/* Practice Problem Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-500 font-medium mr-1">Choose Challenge:</span>
          {TUTOR_PRACTICE_PROBLEMS.map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={() => resetProblem(item.problem)}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                problem === item.problem
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25'
                  : 'bg-slate-100 text-slate-600 hover:bg-sky-50 hover:text-sky-700 border border-slate-200'
              }`}
            >
              {item.title}
            </button>
          ))}
        </div>

        {/* Active Problem Display */}
        <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Current Problem to Solve:
            </span>
            <div className="text-lg text-slate-900 mt-1 font-semibold">
              <MathRenderer content={`$$${problem}$$`} displayMode={false} />
            </div>
          </div>
          <span className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shrink-0 flex items-center gap-1 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Live Grader Active
          </span>
        </div>
      </div>

      {/* Verified Derivations Progress */}
      {verifiedSteps.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl shadow-slate-200/50 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Validated Student Steps ({verifiedSteps.length})</span>
          </div>

          <div className="space-y-2">
            {verifiedSteps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800"
              >
                <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 font-mono text-xs flex items-center justify-center font-bold">
                  {idx + 1}
                </span>
                <div className="flex-1 font-mono text-sm overflow-x-auto text-slate-900">
                  <MathRenderer content={`$$${step}$$`} displayMode={false} />
                </div>
                <span className="text-[10px] text-emerald-700 font-mono font-bold">Valid ✓</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completion Banner */}
      {isCompleted && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-emerald-200 rounded-3xl p-6 sm:p-8 text-center shadow-xl shadow-emerald-500/10 space-y-3 animate-in fade-in duration-300">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600">
            <Trophy className="w-6 h-6 animate-bounce" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Problem Solved Successfully! 🎉</h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            You completed every step correctly. All mathematical transformations were verified deterministic by SymPy.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                const nextIdx = (TUTOR_PRACTICE_PROBLEMS.findIndex((p) => p.problem === problem) + 1) % TUTOR_PRACTICE_PROBLEMS.length;
                resetProblem(TUTOR_PRACTICE_PROBLEMS[nextIdx].problem);
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              Try Next Problem
            </button>
          </div>
        </div>
      )}

      {/* Step Input Area (hidden when completed) */}
      {!isCompleted && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="tutor-proposed-input" className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Your Next Derivation Step:
            </label>
            <span className="text-xs text-sky-600 font-mono font-bold">
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
              className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 rounded-2xl px-4 py-3 text-slate-900 font-mono text-base placeholder-slate-400 outline-none transition-all shadow-inner"
            />
          </div>

          {/* Quick-insert toolbar */}
          <MathToolbar onInsert={(snippet) => setProposedStep((prev) => prev + snippet)} />

          {/* Live input preview */}
          {proposedStep.trim() && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center gap-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Preview:</span>
              <div className="overflow-x-auto text-slate-900 font-semibold">
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
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isLoadingHint ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lightbulb className="w-3.5 h-3.5" />}
              <span>Need a Hint?</span>
            </button>

            <button
              type="button"
              id="btn-verify-student-step"
              onClick={handleVerify}
              disabled={isVerifying || !proposedStep.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold text-xs shadow-md shadow-sky-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
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
          className={`border rounded-3xl p-6 shadow-md transition-all animate-in fade-in duration-200 ${
            feedback.is_valid
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-start gap-3">
            {feedback.is_valid ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-sm">
                  {feedback.is_valid ? 'Step Valid!' : 'Mathematical Error Detected'}
                </span>
                {feedback.error_code && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-rose-100 border border-rose-300 text-rose-800">
                    {feedback.error_code}
                  </span>
                )}
                <span className="text-[10px] font-mono text-slate-500 ml-auto">
                  {feedback.execution_time_ms} ms
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">{feedback.evidence}</p>

              {feedback.suggested_correction && (
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Suggested Next Step:</span>
                  <div className="text-xs font-mono text-sky-700">
                    <MathRenderer content={`$$${feedback.suggested_correction}$$`} displayMode={false} />
                  </div>
                </div>
              )}

              {feedback.pedagogical_hint && (
                <div className="flex items-start gap-1.5 text-xs text-amber-800 pt-1">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{feedback.pedagogical_hint}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Socratic Hint Drawer */}
      {hint && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 text-amber-900 space-y-2 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-xs font-bold">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            <span>Tutor Scaffolding Hint:</span>
            {hint.suggested_technique && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-800 font-mono">
                {hint.suggested_technique}
              </span>
            )}
          </div>
          <p className="text-xs text-amber-800 leading-relaxed pl-6">{hint.hint}</p>
        </div>
      )}
    </div>
  );
};

export default TutorMode;
