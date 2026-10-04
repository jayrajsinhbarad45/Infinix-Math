'use client';

import React, { useEffect, useState } from 'react';
import {
  Calculator,
  Camera,
  Compass,
  Edit3,
  Lightbulb,
  Loader2,
  PenTool,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { solveMathProblem } from '../lib/api';
import { HistoryItem, MathDomain, OcrExtractResponse, SolveResponse } from '../lib/types';
import DrawingCanvas from '../components/DrawingCanvas';
import HistoryDrawer from '../components/HistoryDrawer';
import ImageUploader from '../components/ImageUploader';
import MathRenderer from '../components/MathRenderer';
import MathToolbar from '../components/MathToolbar';
import SolutionViewer from '../components/SolutionViewer';

type InputMode = 'text' | 'image' | 'draw';

const EXAMPLE_PROBLEMS = [
  { label: 'Definite Integral', latex: '\\int_{0}^{2} (3x^2 + 2x) dx', domain: 'integral' as MathDomain },
  { label: 'Quadratic Equation', latex: 'x^2 - 5x + 6 = 0', domain: 'equations' as MathDomain },
  { label: 'Product Rule Derivative', latex: '\\frac{d}{dx}(x^3 \\sin(x))', domain: 'derivative' as MathDomain },
  { label: 'Linear System', latex: '2x + y = 7, x - y = 1', domain: 'equations' as MathDomain },
  { label: 'Rational Simplification', latex: '\\frac{x^2 - 9}{x - 3}', domain: 'algebra' as MathDomain },
];

export default function HomePage() {
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [problemText, setProblemText] = useState('\\int_{0}^{2} (3x^2 + 2x) dx');
  const [selectedDomain, setSelectedDomain] = useState<MathDomain>('auto');
  const [isLoading, setIsLoading] = useState(false);
  const [solution, setSolution] = useState<SolveResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('infinix_math_history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch {
      // LocalStorage unavailable
    }
  }, []);

  // Save history to localStorage
  const saveToHistory = (item: HistoryItem) => {
    setHistory((prev) => {
      const filtered = prev.filter((h) => h.problem_text !== item.problem_text);
      const updated = [item, ...filtered].slice(0, 15);
      try {
        localStorage.setItem('infinix_math_history', JSON.stringify(updated));
      } catch {
        // Ignored
      }
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('infinix_math_history');
    } catch {
      // Ignored
    }
  };

  // Keyboard shortcut Ctrl+Enter to solve
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSolve();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleInsertSnippet = (snippet: string) => {
    setProblemText((prev) => prev + snippet);
  };

  const handleSolve = async (overrideText?: string, overrideDomain?: MathDomain) => {
    const textToSolve = (overrideText ?? problemText).trim();
    if (!textToSolve) {
      setErrorMessage('Please enter an equation or problem expression to solve.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await solveMathProblem({
        problem_text: textToSolve,
        domain: overrideDomain ?? selectedDomain,
      });

      setSolution(res);

      if (res.success) {
        saveToHistory({
          id: Math.random().toString(36).substring(2, 9),
          timestamp: Date.now(),
          problem_text: textToSolve,
          domain: res.domain,
          solution_latex: res.latex_solution,
          is_symbolically_verified: res.is_symbolically_verified,
          steps_count: res.steps.length,
        });
      } else {
        setErrorMessage(res.error || 'Failed to solve problem.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to backend solver.';
      setErrorMessage(msg);
      setSolution(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOcrSuccess = (extractedLatex: string, _ocrMeta: OcrExtractResponse) => {
    setProblemText(extractedLatex);
    setInputMode('text');
    // Automatically trigger solve on OCR extraction
    handleSolve(extractedLatex);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Hero Title */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Zero-Hallucination Symbolic Mathematics</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
          Solve with Absolute Precision
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          Type LaTeX, snap an equation photo with Gemini Vision, or sketch on the drawing pad.
          Every step is verified by Python SymPy.
        </p>
      </div>

      {/* Input Mode Selector Tabs */}
      <div className="flex items-center justify-center">
        <div className="inline-flex p-1.5 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-inner gap-1">
          <button
            type="button"
            id="tab-mode-text"
            onClick={() => setInputMode('text')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              inputMode === 'text'
                ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Formula / Text</span>
          </button>

          <button
            type="button"
            id="tab-mode-image"
            onClick={() => setInputMode('image')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              inputMode === 'image'
                ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Upload Photo (OCR)</span>
          </button>

          <button
            type="button"
            id="tab-mode-draw"
            onClick={() => setInputMode('draw')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              inputMode === 'draw'
                ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Drawing Pad</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Input Card */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl shadow-black/50 space-y-5">
        {/* Domain selection pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/70">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <Compass className="w-4 h-4 text-indigo-400" />
            <span>Domain:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(['auto', 'calculus', 'algebra', 'equations', 'integral', 'derivative'] as MathDomain[]).map(
              (domain) => (
                <button
                  key={domain}
                  type="button"
                  id={`domain-pill-${domain}`}
                  onClick={() => setSelectedDomain(domain)}
                  className={`px-3 py-1 rounded-full text-xs font-mono capitalize transition-all ${
                    selectedDomain === domain
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-500/40'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700/60'
                  }`}
                >
                  {domain}
                </button>
              )
            )}
          </div>
        </div>

        {/* Dynamic Mode Content */}
        {inputMode === 'text' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="math-problem-input" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Mathematical Expression (LaTeX or String)
              </label>
              <div className="relative">
                <textarea
                  id="math-problem-input"
                  rows={3}
                  value={problemText}
                  onChange={(e) => setProblemText(e.target.value)}
                  placeholder="Enter formula, e.g. \int_{0}^{2} x^2 dx, or 2x^2 - 8 = 0"
                  className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-2xl p-4 text-slate-100 font-mono text-base placeholder-slate-600 outline-none transition-all resize-y"
                />
              </div>
            </div>

            {/* Quick-insert Symbol Toolbar */}
            <MathToolbar onInsert={handleInsertSnippet} />

            {/* Live KaTeX Preview */}
            {problemText.trim() && (
              <div className="p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Live KaTeX Preview:
                </span>
                <div className="overflow-x-auto text-indigo-200 text-lg py-1">
                  <MathRenderer content={`$$${problemText}$$`} displayMode={true} />
                </div>
              </div>
            )}
          </div>
        )}

        {inputMode === 'image' && (
          <ImageUploader
            onExtractionSuccess={handleOcrSuccess}
            onError={(msg) => setErrorMessage(msg)}
          />
        )}

        {inputMode === 'draw' && (
          <DrawingCanvas
            onExtractionSuccess={handleOcrSuccess}
            onError={(msg) => setErrorMessage(msg)}
          />
        )}

        {/* Action Controls & Presets */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Quick example presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-500 flex items-center gap-1 mr-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Presets:</span>
            </span>
            {EXAMPLE_PROBLEMS.map((ex) => (
              <button
                key={ex.label}
                type="button"
                onClick={() => {
                  setProblemText(ex.latex);
                  setSelectedDomain(ex.domain);
                  handleSolve(ex.latex, ex.domain);
                }}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/60 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-200 border border-slate-700/50 hover:border-indigo-500/40 transition-colors"
              >
                {ex.label}
              </button>
            ))}
          </div>

          {/* Primary Submit Button */}
          <button
            type="button"
            id="btn-solve-problem"
            onClick={() => handleSolve()}
            disabled={isLoading || !problemText.trim()}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold text-sm shadow-xl shadow-indigo-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Solving with SymPy...</span>
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4" />
                <span>Solve Expression</span>
                <kbd className="hidden sm:inline text-[10px] bg-indigo-700/50 px-1.5 py-0.5 rounded text-indigo-200 border border-indigo-500/30">
                  Ctrl+↵
                </kbd>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Solutions & Derivations Display */}
      <SolutionViewer
        response={solution}
        isLoading={isLoading}
        error={errorMessage}
      />

      {/* Recent Query History Drawer */}
      <HistoryDrawer
        items={history}
        onSelect={(item) => {
          setProblemText(item.problem_text);
          setSelectedDomain(item.domain as MathDomain);
          handleSolve(item.problem_text, item.domain as MathDomain);
        }}
        onClear={clearHistory}
      />
    </div>
  );
}
