'use client';

import React, { useCallback, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Keyboard,
  Loader2,
  Sparkles,
  Volume2,
  XCircle,
} from 'lucide-react';
import MathRenderer from './MathRenderer';
import GraphViewer from './GraphViewer';
import MathKeyboard from './MathKeyboard';
import { solveMathProblem } from '../lib/api';
import { SolveResponse } from '../lib/types';

function getGraphFormulaLabel(input: string): string {
  const trimmed = input.trim();
  if (trimmed.includes('=')) {
    const sides = trimmed.split('=');
    const lhs = sides[0].trim();
    const rhs = sides[1]?.trim();
    if (!rhs || rhs === '0') {
      return `f(x) = ${lhs}`;
    }
    return `f(x) = ${lhs} - (${rhs})`;
  }
  return `f(x) = ${trimmed}`;
}

function cleanStepLatex(raw: string): string {
  if (!raw) return '';
  let s = raw.trim();
  const match = s.match(/^(?:[^:]+:\s*)?\$\$([\s\S]+?)\$\$$/);
  if (match) {
    return match[1].trim();
  }
  if (s.startsWith('$$') && s.endsWith('$$')) {
    return s.slice(2, -2).trim();
  }
  return s;
}

function cleanStepDescription(raw: string, fallbackNumber: number): string {
  if (!raw) return `Step ${fallbackNumber}`;
  let s = raw.trim();

  // If already contains inline math $...$, preserve it
  if (s.includes('$')) {
    return s;
  }

  // Convert equations with carets or polynomials into inline math $...$
  s = s.replace(/(a[a-zA-Z0-9_]*\^2\s*\+\s*b[a-zA-Z0-9_]*\s*\+\s*c\s*=\s*0)/gi, '$$$1$$');
  s = s.replace(/(b\^2\s*-\s*4ac)/gi, '$$$1$$');
  s = s.replace(/\b([a-zA-Z]\^[0-9]+)\b/g, '$$$1$$');

  return s;
}

export const SolverWorkspace: React.FC = () => {
  const [problemInput, setProblemInput] = useState('5x^2 + 9x + 1 = 0');
  const [isSolving, setIsSolving] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [solutionData, setSolutionData] = useState<SolveResponse | null>(null);
  const [solveError, setSolveError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  // Input ref for cursor-aware insertion
  const inputRef = useRef<HTMLInputElement>(null);

  // -----------------------------------------------------------------------
  // Solve handler
  // -----------------------------------------------------------------------
  const handleSolve = useCallback(async (override?: string) => {
    const text = (override ?? problemInput).trim();
    if (!text) return;

    setIsSolving(true);
    setSolveError(null);
    try {
      const res = await solveMathProblem({ problem_text: text });
      setSolutionData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to solver backend';
      setSolveError(msg);
    } finally {
      setIsSolving(false);
    }
  }, [problemInput]);

  // Keyboard Enter to solve
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSolve();
  };

  // Math keyboard insert — cursor-aware
  const handleKeyboardInsert = (latex: string, hasCursor: boolean) => {
    const input = inputRef.current;
    if (!input) {
      setProblemInput((prev) => prev + latex);
      return;
    }

    const start = input.selectionStart ?? problemInput.length;
    const end = input.selectionEnd ?? problemInput.length;
    const before = problemInput.slice(0, start);
    const after = problemInput.slice(end);
    const newValue = before + latex + after;
    setProblemInput(newValue);

    requestAnimationFrame(() => {
      input.focus();
      let cursorPos = start + latex.length;
      if (hasCursor) {
        const braceIndex = latex.indexOf('{');
        if (braceIndex !== -1) {
          cursorPos = start + braceIndex + 1;
        }
      }
      input.setSelectionRange(cursorPos, cursorPos);
    });
  };

  const handleCopySolution = () => {
    const textToCopy = solutionData
      ? `Problem: ${problemInput}\nSolution: ${solutionData.latex_solution}`
      : problemInput;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAudioSolution = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const explanation = solutionData?.structured_steps?.length
      ? solutionData.structured_steps.map((s) => `${s.description}.`).join(' ')
      : `Problem ${problemInput}. Solved using algebraic methods.`;

    const cleanSpeech = explanation
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 over $2')
      .replace(/\\sqrt\{([^}]+)\}/g, 'square root of $1')
      .replace(/[\$\\]/g, '')
      .replace(/\^2/g, ' squared');

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const graphFormulaLabel = getGraphFormulaLabel(problemInput);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300 antialiased select-none">

      {/* Top Formula Input & Controls Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-sky-950/5 border border-slate-100 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">

          {/* Formula Input Box */}
          <div className="flex-1 relative flex items-center bg-[#f0f9ff] border border-[#bae6fd] focus-within:border-[#00a8ff] focus-within:bg-white rounded-2xl px-4 py-2.5 transition-all shadow-inner">
            <input
              ref={inputRef}
              type="text"
              value={problemInput}
              onChange={(e) => setProblemInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter equation (e.g. 5x^2 + 9x + 1 = 0)"
              className="w-full bg-transparent border-none text-slate-900 font-mono text-base outline-none placeholder-slate-400"
              id="formula-input"
              autoComplete="off"
              spellCheck={false}
            />

            {/* Keyboard Toggle */}
            <button
              type="button"
              id="btn-keyboard-toggle"
              onClick={() => setShowKeyboard((v) => !v)}
              title="Toggle Math Keyboard"
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                showKeyboard
                  ? 'bg-[#00a8ff] text-white shadow-xs'
                  : 'text-slate-600 hover:text-sky-600 hover:bg-sky-100/60'
              }`}
            >
              <Keyboard className="w-4 h-4" />
              <span className="hidden sm:inline">Keys</span>
            </button>
          </div>

          {/* Solve Button */}
          <button
            type="button"
            id="btn-main-solve"
            onClick={() => handleSolve()}
            disabled={isSolving || !problemInput.trim()}
            className="px-7 py-3 rounded-2xl bg-[#00a8ff] hover:bg-[#0096e6] text-white font-bold text-sm tracking-wide uppercase shadow-lg shadow-sky-400/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
          >
            {isSolving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Solving...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Solve</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Live Equation KaTeX Preview */}
        {problemInput.trim() && (
          <div className="pt-2 px-1 text-slate-900 text-lg font-medium overflow-x-auto flex items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Preview:</span>
            <MathRenderer content={`$$${problemInput}$$`} displayMode={false} />
          </div>
        )}

        {/* Error notification */}
        {solveError && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{solveError}</span>
          </div>
        )}
      </div>

      {/* Floating Virtual Math Keyboard */}
      <MathKeyboard
        isVisible={showKeyboard}
        onInsert={handleKeyboardInsert}
      />

      {/* 2-COLUMN STUDIO LAYOUT MATCHING CONCEPT B EXACTLY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT COLUMN: Concept B Solution Card */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-sky-950/5 border border-slate-100 space-y-6">

          {/* Top Pill Badges matching Concept B */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="bg-[#00a8ff] text-white text-[11px] font-black tracking-wider px-3.5 py-1 rounded-full uppercase shadow-xs">
                SOLUTION CARD
              </span>
              <span className="bg-[#e0f2fe] text-[#0284c7] text-[11px] font-bold tracking-wider px-3.5 py-1 rounded-full uppercase">
                MATH SOLV &amp; ALGEBRA
              </span>
            </div>

            {solutionData?.is_symbolically_verified && !isSolving && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified</span>
              </div>
            )}
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              CALCULUS &amp; ALGEBRA SOLUTION
            </h2>
            <div className="text-base font-semibold text-slate-700 py-1">
              <MathRenderer content={`$$f(x) = ${problemInput}$$`} displayMode={false} />
            </div>
          </div>

          {/* Solving State */}
          {isSolving && (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#00a8ff]" />
              <p className="text-sm font-semibold text-slate-500">Computing symbolic step-by-step solution...</p>
            </div>
          )}

          {/* Step-by-Step Solution List */}
          {!isSolving && (
            <div className="space-y-5 pt-2">
              {solutionData && solutionData.structured_steps.length > 0 ? (
                <>
                  {/* Steps */}
                  <div className="space-y-4">
                    {solutionData.structured_steps.map((st) => {
                      const stepMath = cleanStepLatex(st.latex);
                      const stepTitle = cleanStepDescription(st.description, st.step_number);

                      return (
                        <div key={st.step_number} className="space-y-2">
                          <div className="flex items-baseline gap-2 text-slate-900 font-bold text-sm sm:text-base">
                            <span className="text-[#00a8ff]">{st.step_number}.</span>
                            <MathRenderer content={stepTitle} displayMode={false} />
                          </div>
                          {stepMath && (
                            <div className="pl-5 overflow-x-auto text-slate-800 text-sm sm:text-base py-1">
                              <MathRenderer content={stepMath} displayMode={true} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Final Result Card */}
                  <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-blue-50/60 border border-sky-200 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#0284c7]">
                      <span>Final Solution</span>
                      <span className="font-mono text-slate-400 font-normal">{solutionData.execution_time_ms}ms</span>
                    </div>
                    <div className="overflow-x-auto text-center sm:text-left text-slate-900 font-bold text-lg py-1">
                      <MathRenderer content={cleanStepLatex(solutionData.latex_solution)} displayMode={true} />
                    </div>
                  </div>
                </>
              ) : !solutionData ? (
                /* Default Pedagogical Demo Steps */
                <div className="space-y-4 text-slate-900">
                  <div className="space-y-1.5">
                    <div className="font-bold text-sm sm:text-base">
                      1. Identify coefficients from standard form ax^2 + bx + c = 0
                    </div>
                    <div className="pl-5 text-slate-700 text-sm">
                      <MathRenderer content="$$a = 5, \quad b = 9, \quad c = 1$$" displayMode={true} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="font-bold text-sm sm:text-base">
                      2. Calculate the discriminant D = b^2 - 4ac
                    </div>
                    <div className="pl-5 text-slate-700 text-sm">
                      <MathRenderer content="$$D = 9^2 - 4(5)(1) = 81 - 20 = 61$$" displayMode={true} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="font-bold text-sm sm:text-base">
                      3. Apply the quadratic formula
                    </div>
                    <div className="pl-5 text-slate-700 text-sm">
                      <MathRenderer content="$$x = \frac{-b \pm \sqrt{D}}{2a} = \frac{-9 \pm \sqrt{61}}{10}$$" displayMode={true} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="font-bold text-sm sm:text-base">
                      4. Write the two real solutions
                    </div>
                    <div className="pl-5 text-slate-700 text-sm">
                      <MathRenderer content="$$x = \frac{-9 - \sqrt{61}}{10}, \quad x = \frac{-9 + \sqrt{61}}{10}$$" displayMode={true} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                  {solutionData.error || 'The symbolic engine could not compute steps for this input.'}
                </div>
              )}
            </div>
          )}

          {/* Bottom Action Bar matching Concept B */}
          <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
            <button
              type="button"
              onClick={handleCopySolution}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={handleAudioSolution}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer ${
                speaking
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                  : 'bg-[#e0f2fe] hover:bg-[#bae6fd] text-[#0284c7] border border-sky-200'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{speaking ? 'Stop Audio' : 'Audio Solution'}</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Concept B Interactive Graph Card */}
        <div className="lg:col-span-5 sticky top-24">
          <GraphViewer
            formulaLabel={graphFormulaLabel}
            solvedLatex={solutionData?.latex_solution}
            inputExpression={problemInput}
          />
        </div>
      </div>
    </div>
  );
};

export default SolverWorkspace;
