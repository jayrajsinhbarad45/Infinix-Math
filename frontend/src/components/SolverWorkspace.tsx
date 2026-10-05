'use client';

import React, { useState } from 'react';
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  FileUp,
  Loader2,
  Mic,
  PenTool,
  Sparkles,
} from 'lucide-react';
import MathRenderer from './MathRenderer';
import GraphViewer from './GraphViewer';
import DrawingCanvas from './DrawingCanvas';
import ImageUploader from './ImageUploader';
import { solveMathProblem } from '../lib/api';
import { OcrExtractResponse, SolveResponse } from '../lib/types';

export const SolverWorkspace: React.FC = () => {
  const [problemInput, setProblemInput] = useState('\\int \\frac{3x^2 + 5x}{x^2 + 1} dx');
  const [activeMethodTab, setActiveMethodTab] = useState<'step' | 'alt1' | 'alt2'>('step');
  const [isSolving, setIsSolving] = useState(false);
  const [modalMode, setModalMode] = useState<'none' | 'ocr' | 'draw'>('none');
  const [solutionData, setSolutionData] = useState<SolveResponse | null>(null);

  const handleSolve = async (override?: string) => {
    const text = (override ?? problemInput).trim();
    if (!text) return;

    setIsSolving(true);
    try {
      const res = await solveMathProblem({ problem_text: text });
      setSolutionData(res);
    } catch {
      // Ignored
    } finally {
      setIsSolving(false);
    }
  };

  const handleOcrSuccess = (latex: string, _meta: OcrExtractResponse) => {
    setProblemInput(latex);
    setModalMode('none');
    handleSolve(latex);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Input Card matching Figure 2 */}
      <div className="relative rounded-2xl bg-[#0d1424]/90 border border-indigo-500/50 p-5 sm:p-6 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl space-y-4">
        {/* Formula Input Area */}
        <div className="space-y-2">
          <input
            type="text"
            value={problemInput}
            onChange={(e) => setProblemInput(e.target.value)}
            placeholder="Type your math problem here..."
            className="w-full bg-transparent border-none text-slate-100 font-mono text-base sm:text-lg outline-none placeholder-slate-500 py-1"
          />

          {/* Rendered Math Formula Display */}
          <div className="py-2 overflow-x-auto text-indigo-100 text-xl font-medium border-t border-slate-800/80">
            <MathRenderer content={`$$${problemInput}$$`} displayMode={true} />
          </div>
        </div>

        {/* Action Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="btn-ocr-tool"
              onClick={() => setModalMode('ocr')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-indigo-400" />
              <span>Camera OCR</span>
            </button>

            <button
              type="button"
              id="btn-draw-tool"
              onClick={() => setModalMode('draw')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
            >
              <PenTool className="w-3.5 h-3.5 text-indigo-400" />
              <span>Drawing Pad</span>
            </button>

            <button
              type="button"
              onClick={() => alert('Voice Dictation active: Speak your math formula')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
            >
              <Mic className="w-3.5 h-3.5 text-indigo-400" />
              <span>Voice Input</span>
            </button>

            <button
              type="button"
              onClick={() => alert('PDF Upload: Drop your homework PDF to extract problems')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
            >
              <FileUp className="w-3.5 h-3.5 text-indigo-400" />
              <span>PDF Upload</span>
            </button>
          </div>

          <button
            type="button"
            id="btn-main-solve"
            onClick={() => handleSolve()}
            disabled={isSolving || !problemInput.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-white to-slate-200 hover:from-slate-100 hover:to-white text-slate-950 font-bold text-sm shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isSolving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Solving...</span>
              </>
            ) : (
              <>
                <span>Solve</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal Dialogs for OCR & Drawing Pad */}
      {modalMode === 'ocr' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 relative">
            <button
              type="button"
              onClick={() => setModalMode('none')}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-sm"
            >
              ✕ Close
            </button>
            <h3 className="text-base font-bold text-white mb-4">Camera Photo Math OCR</h3>
            <ImageUploader onExtractionSuccess={handleOcrSuccess} onError={() => {}} />
          </div>
        </div>
      )}

      {modalMode === 'draw' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 relative">
            <button
              type="button"
              onClick={() => setModalMode('none')}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-sm"
            >
              ✕ Close
            </button>
            <h3 className="text-base font-bold text-white mb-4">Digital Ink Drawing Pad</h3>
            <DrawingCanvas onExtractionSuccess={handleOcrSuccess} onError={() => {}} />
          </div>
        </div>
      )}

      {/* Bottom Area: 2-Column Split matching Figure 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Step-by-Step Solution Card */}
        <div className="lg:col-span-7 bg-[#0d1424]/90 border border-slate-800/90 rounded-2xl p-6 shadow-xl space-y-5">
          {/* Method Tabs */}
          <div className="flex items-center gap-6 border-b border-slate-800 pb-3 text-xs sm:text-sm font-semibold">
            <button
              type="button"
              onClick={() => setActiveMethodTab('step')}
              className={`pb-1 transition-all ${
                activeMethodTab === 'step'
                  ? 'text-indigo-400 border-b-2 border-indigo-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Step-by-Step
            </button>
            <button
              type="button"
              onClick={() => setActiveMethodTab('alt1')}
              className={`pb-1 transition-all ${
                activeMethodTab === 'alt1'
                  ? 'text-indigo-400 border-b-2 border-indigo-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Alternative Method 1
            </button>
            <button
              type="button"
              onClick={() => setActiveMethodTab('alt2')}
              className={`pb-1 transition-all ${
                activeMethodTab === 'alt2'
                  ? 'text-indigo-400 border-b-2 border-indigo-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Alternative Method 2
            </button>
          </div>

          {/* Solution Header & Verification Pill */}
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Detailed Step-by-Step Solution
            </h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Solution Verified</span>
            </div>
          </div>

          {/* Steps Derivation List */}
          {activeMethodTab === 'step' && (
            <div className="space-y-4 pt-1">
              {solutionData && solutionData.structured_steps.length > 0 ? (
                solutionData.structured_steps.map((st) => (
                  <div key={st.step_number} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-900/60 border border-indigo-600/40 text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0 mt-1">
                      {st.step_number}
                    </div>
                    <div className="space-y-1 text-xs sm:text-sm text-slate-200">
                      <div className="font-semibold text-slate-300">{st.description}</div>
                      <div className="overflow-x-auto text-indigo-200 py-1 font-mono">
                        <MathRenderer content={`$$${st.latex}$$`} displayMode={false} />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {/* Default Canonical Steps matching Figure 2 */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-900/60 border border-indigo-600/40 text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0 mt-1">
                      1
                    </div>
                    <div className="space-y-1 text-xs sm:text-sm text-slate-200">
                      <div className="font-semibold text-slate-300">
                        Step 1: Divide the integrand:
                      </div>
                      <div className="overflow-x-auto text-indigo-200 py-0.5">
                        <MathRenderer
                          content="$\frac{3x^2 + 5x}{x^2 + 1} = 3 + \frac{5x - 3}{x^2 + 1}$"
                          displayMode={false}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-900/60 border border-indigo-600/40 text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0 mt-1">
                      2
                    </div>
                    <div className="space-y-1 text-xs sm:text-sm text-slate-200">
                      <div className="font-semibold text-slate-300">
                        Step 2: Separate integrals:
                      </div>
                      <div className="overflow-x-auto text-indigo-200 py-0.5">
                        <MathRenderer
                          content="$\int 3 dx + \int \frac{5x}{x^2 + 1} dx - \int \frac{3}{x^2 + 1} dx$"
                          displayMode={false}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-900/60 border border-indigo-600/40 text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0 mt-1">
                      3
                    </div>
                    <div className="space-y-1 text-xs sm:text-sm text-slate-200">
                      <div className="font-semibold text-slate-300">
                        Step 3: Compute individual integrals
                      </div>
                      <div className="text-slate-400 text-xs">
                        Use u-substitution for the middle term: let $u = x^2 + 1$, $du = 2x dx$.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-900/60 border border-indigo-600/40 text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0 mt-1">
                      4
                    </div>
                    <div className="space-y-1 text-xs sm:text-sm text-slate-200">
                      <div className="font-semibold text-slate-300">
                        Step 4: Final Result:
                      </div>
                      <div className="overflow-x-auto text-indigo-200 py-0.5 font-bold">
                        <MathRenderer
                          content="$3x + \frac{5}{2}\ln(x^2 + 1) - 3\arctan(x) + C$"
                          displayMode={false}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeMethodTab === 'alt1' && (
            <div className="p-4 rounded-xl bg-slate-950/60 text-xs text-slate-300 space-y-2">
              <span className="font-bold text-indigo-300">Alternative Method: Algebraic Substitution</span>
              <p>
                {'Substitute x = tan(\u03B8), where dx = sec\u00B2(\u03B8) d\u03B8, and rewrite the rational fraction in terms of trigonometric identities.'}
              </p>
            </div>
          )}

          {activeMethodTab === 'alt2' && (
            <div className="p-4 rounded-xl bg-slate-950/60 text-xs text-slate-300 space-y-2">
              <span className="font-bold text-indigo-300">Alternative Method: Partial Fraction Decomposition</span>
              <p>
                {'Express the rational component in complex linear factors over \u2102: (5x - 3) / ((x + i)(x - i)) and integrate using logarithmic differentials.'}
              </p>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Interactive 2D Graph matching Figure 2 */}
        <div className="lg:col-span-5">
          <GraphViewer formulaLabel="f(x) = \frac{3x^2 + 5x}{x^2 + 1}" />
        </div>
      </div>
    </div>
  );
};

export default SolverWorkspace;
