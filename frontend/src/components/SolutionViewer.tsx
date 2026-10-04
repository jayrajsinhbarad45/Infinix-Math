'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Code,
  Copy,
  Layers,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { MathRenderer } from './MathRenderer';
import { SolveResponse } from '../lib/types';

interface SolutionViewerProps {
  response: SolveResponse | null;
  isLoading: boolean;
  error?: string | null;
}

export const SolutionViewer: React.FC<SolutionViewerProps> = ({
  response,
  isLoading,
  error,
}) => {
  const [copied, setCopied] = useState(false);
  const [showRawLatex, setShowRawLatex] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});

  const toggleStep = (index: number) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="w-full bg-slate-900/60 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center backdrop-blur-xl animate-pulse space-y-4">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 animate-spin">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-200">Executing Symbolic Mathematics...</h3>
          <p className="text-xs text-slate-400 mt-1">
            Running SymPy algebraic simplification and deterministic step verification
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-rose-950/20 border border-rose-800/40 rounded-3xl p-6 backdrop-blur-xl text-rose-300 space-y-2">
        <div className="flex items-center gap-2 font-semibold">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>Computation Error</span>
        </div>
        <p className="text-xs text-rose-300/90 pl-7">{error}</p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="w-full bg-slate-900/40 border border-slate-800/60 rounded-3xl p-10 text-center backdrop-blur-xl text-slate-500 space-y-2">
        <Layers className="w-10 h-10 mx-auto text-slate-600/70" />
        <p className="text-sm font-medium text-slate-400">Ready to solve</p>
        <p className="text-xs text-slate-500">
          Enter an equation, upload an image, or pick an example below to view step-by-step verified derivations.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Primary Solution Card */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl shadow-black/40">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            {response.is_symbolically_verified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/40 text-emerald-300 border border-emerald-700/50 shadow-sm shadow-emerald-900/20">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Symbolically Verified (SymPy)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/40 text-amber-300 border border-amber-700/50">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Pedagogical AI Solution
              </span>
            )}

            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-slate-800/60 text-slate-300 border border-slate-700/60 capitalize">
              {response.domain}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              {response.execution_time_ms} ms
            </span>

            <button
              type="button"
              id="btn-copy-solution"
              onClick={() => copyToClipboard(response.latex_solution)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
              title="Copy LaTeX Solution"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              id="btn-inspect-raw-latex"
              onClick={() => setShowRawLatex(!showRawLatex)}
              className={`p-1 rounded-lg border transition-colors ${
                showRawLatex
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white border-slate-700/60'
              }`}
              title="Inspect raw LaTeX"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Canonical Solution Rendering */}
        <div className="py-6">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
            Final Canonical Answer
          </p>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 flex items-center justify-center overflow-x-auto text-xl sm:text-2xl text-indigo-100">
            <MathRenderer content={`$$${response.latex_solution}$$`} displayMode={true} />
          </div>
        </div>

        {/* Raw LaTeX Drawer */}
        {showRawLatex && (
          <div className="mt-4 p-4 bg-black/60 border border-slate-800 rounded-xl space-y-2">
            <p className="text-xs font-mono text-slate-400">Raw LaTeX String:</p>
            <pre className="text-xs font-mono text-indigo-300 whitespace-pre-wrap break-all select-all">
              {response.latex_solution}
            </pre>
          </div>
        )}
      </div>

      {/* Step-by-Step Derivations */}
      {response.steps && response.steps.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-semibold text-slate-100">
                Step-by-Step Derivation ({response.steps.length} steps)
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Deterministic SymPy proof steps
            </span>
          </div>

          <div className="space-y-3">
            {response.steps.map((step, idx) => {
              const isExpanded = expandedSteps[idx] ?? true;
              const hasColon = step.includes(':');
              const title = hasColon ? step.split(':')[0] : `Step ${idx + 1}`;
              const content = hasColon ? step.substring(step.indexOf(':') + 1).trim() : step;

              return (
                <div
                  key={idx}
                  className="group border border-slate-800 hover:border-slate-700/80 bg-slate-950/40 rounded-2xl p-4 transition-all duration-150"
                >
                  <div
                    onClick={() => toggleStep(idx)}
                    className="flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium text-slate-200 group-hover:text-indigo-300 transition-colors">
                        {title}
                      </span>
                    </div>
                    <button type="button" className="text-slate-500 group-hover:text-slate-300">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-800/60 text-slate-300 overflow-x-auto">
                      <MathRenderer content={content} displayMode={true} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SolutionViewer;
