'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Calculator,
  Camera,
  Compass,
  Edit3,
  FileText,
  GraduationCap,
  Grid3X3,
  Infinity as InfinityIcon,
  Lightbulb,
  Loader2,
  PenTool,
  Settings,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { solveMathProblem } from '../lib/api';
import { HistoryItem, MathDomain, OcrExtractResponse, SolveResponse } from '../lib/types';
import AppShell, { WorkspaceTab } from '../components/AppShell';
import DrawingCanvas from '../components/DrawingCanvas';
import HistoryDrawer from '../components/HistoryDrawer';
import ImageUploader from '../components/ImageUploader';
import MathRenderer from '../components/MathRenderer';
import MathToolbar from '../components/MathToolbar';
import SolutionViewer from '../components/SolutionViewer';
import TutorMode from '../components/TutorMode';

type InputMode = 'text' | 'image' | 'draw';

const EXAMPLE_PROBLEMS = [
  { label: 'Definite Integral', latex: '\\int_{0}^{2} (3x^2 + 2x) dx', domain: 'integral' as MathDomain },
  { label: 'Quadratic Equation', latex: 'x^2 - 5x + 6 = 0', domain: 'equations' as MathDomain },
  { label: 'Derivative Product Rule', latex: '\\frac{d}{dx}(x^3 \\sin(x))', domain: 'derivative' as MathDomain },
  { label: 'Linear System', latex: '2x + y = 7, x - y = 1', domain: 'equations' as MathDomain },
  { label: 'Rational Expression', latex: '\\frac{x^2 - 9}{x - 3}', domain: 'algebra' as MathDomain },
];

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('solver');
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [problemText, setProblemText] = useState('\\int_{0}^{2} (3x^2 + 2x) dx');
  const [selectedDomain, setSelectedDomain] = useState<MathDomain>('auto');
  const [isLoading, setIsLoading] = useState(false);
  const [solution, setSolution] = useState<SolveResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Route protection: redirect to /login if unauthenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('infinix_math_history');
      if (stored) setHistory(JSON.parse(stored));
    } catch {
      // Ignored
    }
  }, []);

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

  const handleInsertSnippet = (snippet: string) => {
    setProblemText((prev) => prev + snippet);
  };

  const handleSolve = async (overrideText?: string, overrideDomain?: MathDomain) => {
    const textToSolve = (overrideText ?? problemText).trim();
    if (!textToSolve) {
      setErrorMessage('Please enter an expression to solve.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await solveMathProblem({
        problem_text: textToSolve,
        domain: overrideDomain ?? selectedDomain,
      });

      if (res.success) {
        setSolution(res);
        saveToHistory({
          id: `hist_${Date.now()}`,
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
    handleSolve(extractedLatex);
  };

  // Loading skeleton while checking authentication state
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-fuchsia-600 p-[1.5px] shadow-xl shadow-indigo-500/30">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-indigo-400">
              <InfinityIcon className="w-8 h-8 text-indigo-400 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="text-sm font-semibold text-slate-400 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          <span>Loading Infinix Math Workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <AppShell currentTab={activeTab} onTabChange={setActiveTab}>
      {/* View: Solver Workspace */}
      {activeTab === 'solver' && (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
          {/* Hero Banner */}
          <div className="text-center space-y-3 pt-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Zero-Hallucination Symbolic CAS Engine</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
              Solve with Absolute Precision
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
              Type mathematical formulas, upload a photo with Gemini Vision OCR, or draw on the whiteboard. Every derivation is verified by SymPy.
            </p>
          </div>

          {/* Input Mode Selector Tabs */}
          <div className="flex items-center justify-center">
            <div className="inline-flex p-1.5 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-inner gap-1">
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

          {/* Main Solver Input Card */}
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

            {/* Input Content based on mode */}
            {inputMode === 'text' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="math-problem-input" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Mathematical Expression (LaTeX or String)
                  </label>
                  <textarea
                    id="math-problem-input"
                    rows={3}
                    value={problemText}
                    onChange={(e) => setProblemText(e.target.value)}
                    placeholder="Enter formula, e.g. \\int_{0}^{2} x^2 dx, or 2x^2 - 8 = 0"
                    className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-2xl p-4 text-slate-100 font-mono text-base placeholder-slate-600 outline-none transition-all resize-y"
                  />
                </div>

                <MathToolbar onInsert={handleInsertSnippet} />

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

            {/* Presets and Submit */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
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

              <button
                type="button"
                id="btn-solve-problem"
                onClick={() => handleSolve()}
                disabled={isLoading || !problemText.trim()}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold text-sm shadow-xl shadow-indigo-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all cursor-pointer"
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
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Solutions & Derivations Display */}
          <SolutionViewer response={solution} isLoading={isLoading} error={errorMessage} />

          {/* Query History Drawer */}
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
      )}

      {/* View: AI Tutor Workspace */}
      {activeTab === 'tutor' && (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
          <TutorMode />
        </div>
      )}

      {/* View: PDF Homework Helper (Phase 4 Placeholder) */}
      {activeTab === 'pdf_helper' && (
        <div className="max-w-4xl mx-auto py-12 text-center space-y-6 animate-in fade-in duration-300">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phase 4 Module</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">PDF Homework Helper Workspace</h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              Upload multi-page textbook PDFs, use the bounding-box lasso tool to crop questions, and solve them side-by-side with full document annotation tools.
            </p>
          </div>
        </div>
      )}

      {/* View: Graphing Calculator (Phase 5 Placeholder) */}
      {activeTab === 'graphing' && (
        <div className="max-w-4xl mx-auto py-12 text-center space-y-6 animate-in fade-in duration-300">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phase 5 Module</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Interactive 2D & 3D Graphing Canvas</h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              Plot explicit, implicit, polar, and parametric functions. Inspect critical points, calculate tangent line slopes, and visualize 3D multivariable surfaces.
            </p>
          </div>
        </div>
      )}

      {/* View: 45+ Calculators (Phase 5 Placeholder) */}
      {activeTab === 'calculators' && (
        <div className="max-w-4xl mx-auto py-12 text-center space-y-6 animate-in fade-in duration-300">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Grid3X3 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phase 5 Module</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">45+ Specialized Subject Calculators</h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              Dedicated calculators for Fractions, Polynomial Factoring, Quadratic Equations, Derivatives, Integrals, Limits, Matrix RREF, Normal Distribution, and Physics.
            </p>
          </div>
        </div>
      )}

      {/* View: Notebooks & Study Suite (Phase 6 Placeholder) */}
      {activeTab === 'notebooks' && (
        <div className="max-w-4xl mx-auto py-12 text-center space-y-6 animate-in fade-in duration-300">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phase 6 Module</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Subject Notebooks & Study Suite</h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              Organize solved problems into class notebooks, generate digital flashcards automatically, and test yourself with adaptive diagnostic quizzes.
            </p>
          </div>
        </div>
      )}

      {/* View: Settings */}
      {activeTab === 'settings' && (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-2xl font-bold text-white">Account & Preferences</h2>
            <p className="text-xs text-slate-400">Configure application appearance and calculation preferences.</p>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 className="text-sm font-semibold text-slate-200">User Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500">Username:</span>
                  <div className="font-mono text-slate-200 mt-1">{user?.username || 'admin'}</div>
                </div>
                <div>
                  <span className="text-slate-500">Role:</span>
                  <div className="text-indigo-400 font-semibold mt-1">{user?.role || 'Administrator'}</div>
                </div>
                <div>
                  <span className="text-slate-500">Subscription Tier:</span>
                  <div className="text-emerald-400 font-semibold mt-1">{user?.plan || 'Prime Pro'} (Active)</div>
                </div>
                <div>
                  <span className="text-slate-500">Authentication Method:</span>
                  <div className="text-slate-300 mt-1">Static Development Build (admin / admin)</div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 className="text-sm font-semibold text-slate-200">Mathematical Engine Preferences</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1.5">Angle Unit:</label>
                  <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 outline-none">
                    <option>Radians (rad)</option>
                    <option>Degrees (°)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1.5">Decimal Precision:</label>
                  <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 outline-none">
                    <option>6 Decimal Places</option>
                    <option>4 Decimal Places</option>
                    <option>8 Decimal Places</option>
                    <option>10 Decimal Places</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
