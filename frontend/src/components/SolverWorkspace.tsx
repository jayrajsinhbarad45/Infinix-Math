'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  FileUp,
  Keyboard,
  Loader2,
  Mic,
  MicOff,
  PenTool,
  Sparkles,
  XCircle,
} from 'lucide-react';
import MathRenderer from './MathRenderer';
import GraphViewer from './GraphViewer';
import DrawingCanvas from './DrawingCanvas';
import ImageUploader from './ImageUploader';
import MathKeyboard from './MathKeyboard';
import { solveMathProblem } from '../lib/api';
import { OcrExtractResponse, SolveResponse } from '../lib/types';

// ---------------------------------------------------------------------------
// Voice dictation helpers — uses Web Speech API (no external lib required)
// ---------------------------------------------------------------------------
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

type SpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
};

type SpeechRecognitionEvent = {
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionResultList = {
  length: number;
  [index: number]: SpeechRecognitionResult;
};

type SpeechRecognitionResult = {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
};

type SpeechRecognitionAlternative = {
  transcript: string;
};

/**
 * Maps spoken math phrases to LaTeX tokens.
 * Extended coverage for common university-level math.
 */
function spokenMathToLatex(text: string): string {
  let t = text.toLowerCase().trim();

  // ---- Calculus -------------------------------------------------------
  t = t.replace(/integral of\s+/g, '\\int ');
  t = t.replace(/integrate\s+/g, '\\int ');
  t = t.replace(/definite integral from\s+(\S+)\s+to\s+(\S+)\s+of\s+/g, '\\int_{$1}^{$2} ');
  t = t.replace(/derivative of\s+/g, '\\frac{d}{dx}\\left( ');
  t = t.replace(/d by dx\s+/g, '\\frac{d}{dx}\\left( ');
  t = t.replace(/limit as x approaches (\S+)\s+of\s+/g, '\\lim_{x \\to $1} ');
  t = t.replace(/limit as x goes to (\S+)\s+of\s+/g, '\\lim_{x \\to $1} ');

  // ---- Powers & roots --------------------------------------------------
  t = t.replace(/squared/g, '^{2}');
  t = t.replace(/cubed/g, '^{3}');
  t = t.replace(/to the power of\s+(\S+)/g, '^{$1}');
  t = t.replace(/to the\s+(\S+)\s+power/g, '^{$1}');
  t = t.replace(/square root of\s+(\S+)/g, '\\sqrt{$1}');
  t = t.replace(/cube root of\s+(\S+)/g, '\\sqrt[3]{$1}');

  // ---- Fractions -------------------------------------------------------
  t = t.replace(/(\S+)\s+over\s+(\S+)/g, '\\frac{$1}{$2}');
  t = t.replace(/(\S+)\s+divided by\s+(\S+)/g, '\\frac{$1}{$2}');

  // ---- Trig ------------------------------------------------------------
  t = t.replace(/\bsin\b/g, '\\sin');
  t = t.replace(/\bcos\b/g, '\\cos');
  t = t.replace(/\btan\b/g, '\\tan');
  t = t.replace(/sine/g, '\\sin');
  t = t.replace(/cosine/g, '\\cos');
  t = t.replace(/tangent/g, '\\tan');
  t = t.replace(/arc ?sin/g, '\\arcsin');
  t = t.replace(/arc ?cos/g, '\\arccos');
  t = t.replace(/arc ?tan/g, '\\arctan');

  // ---- Logarithms ------------------------------------------------------
  t = t.replace(/natural log of\s+(\S+)/g, '\\ln($1)');
  t = t.replace(/log base\s+(\S+)\s+of\s+(\S+)/g, '\\log_{$1}($2)');
  t = t.replace(/\blog\b/g, '\\log');
  t = t.replace(/\bln\b/g, '\\ln');

  // ---- Greek / constants -----------------------------------------------
  t = t.replace(/\balpha\b/g, '\\alpha');
  t = t.replace(/\bbeta\b/g, '\\beta');
  t = t.replace(/\bgamma\b/g, '\\gamma');
  t = t.replace(/\bdelta\b/g, '\\delta');
  t = t.replace(/\btheta\b/g, '\\theta');
  t = t.replace(/\blambda\b/g, '\\lambda');
  t = t.replace(/\bsigma\b/g, '\\sigma');
  t = t.replace(/\bomega\b/g, '\\omega');
  t = t.replace(/\bpi\b/g, '\\pi');
  t = t.replace(/\binfinity\b/g, '\\infty');

  // ---- Arithmetic operators -------------------------------------------
  t = t.replace(/\bplus\b/g, '+');
  t = t.replace(/\bminus\b/g, '-');
  t = t.replace(/\btimes\b/g, '\\times');
  t = t.replace(/\bmultiplied by\b/g, '\\times');
  t = t.replace(/\bequals\b/g, '=');
  t = t.replace(/\bequal to\b/g, '=');

  // Collapse multiple spaces
  t = t.replace(/\s{2,}/g, ' ').trim();

  return t;
}

export const SolverWorkspace: React.FC = () => {
  const [problemInput, setProblemInput] = useState('\\int \\frac{3x^2 + 5x}{x^2 + 1} dx');
  const [activeMethodTab, setActiveMethodTab] = useState<'step' | 'alt1' | 'alt2'>('step');
  const [isSolving, setIsSolving] = useState(false);
  const [modalMode, setModalMode] = useState<'none' | 'ocr' | 'draw'>('none');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [solutionData, setSolutionData] = useState<SolveResponse | null>(null);
  const [solveError, setSolveError] = useState<string | null>(null);

  // Voice dictation state
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

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

  // -----------------------------------------------------------------------
  // Keyboard Enter to solve
  // -----------------------------------------------------------------------
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSolve();
  };

  // -----------------------------------------------------------------------
  // OCR success handler
  // -----------------------------------------------------------------------
  const handleOcrSuccess = (latex: string, _meta: OcrExtractResponse) => {
    setProblemInput(latex);
    setModalMode('none');
    handleSolve(latex);
  };

  // -----------------------------------------------------------------------
  // Math keyboard insert — cursor-aware
  // -----------------------------------------------------------------------
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

    // Restore cursor: if hasCursor, place inside the first brace; otherwise after the inserted text
    requestAnimationFrame(() => {
      input.focus();
      let cursorPos = start + latex.length;
      if (hasCursor) {
        // Find first open brace position within inserted latex
        const braceIndex = latex.indexOf('{');
        if (braceIndex !== -1) {
          cursorPos = start + braceIndex + 1;
        }
      }
      input.setSelectionRange(cursorPos, cursorPos);
    });
  };

  // -----------------------------------------------------------------------
  // Voice dictation — Web Speech API
  // -----------------------------------------------------------------------
  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setVoiceError('Voice input is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    setVoiceError(null);
    setVoiceTranscript('');

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let finalText = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      // Show interim as preview
      setVoiceTranscript(interim || finalText);

      // On final result — convert to LaTeX and insert
      if (finalText) {
        const converted = spokenMathToLatex(finalText);
        setProblemInput((prev) => {
          const input = inputRef.current;
          if (!input) return prev + converted;
          const pos = input.selectionStart ?? prev.length;
          return prev.slice(0, pos) + converted + prev.slice(pos);
        });
        setVoiceTranscript('');
      }
    };

    recognition.onerror = (event: { error: string }) => {
      setVoiceError(`Mic error: ${event.error}. Please allow microphone access.`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setVoiceTranscript('');
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  // -----------------------------------------------------------------------
  // Derive formula label for graph from solution or input
  // -----------------------------------------------------------------------
  const graphFormulaLabel = solutionData?.latex_solution
    ? `f(x) = ${solutionData.latex_solution}`
    : `f(x) = ${problemInput}`;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 animate-in fade-in duration-300">

      {/* ===== INPUT CARD ===== */}
      <div className="relative rounded-2xl bg-[#0d1424]/90 border border-indigo-500/50 p-5 sm:p-6 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl space-y-4">

        {/* Formula Input Row */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Formula
            </label>
            {isListening && voiceTranscript && (
              <span className="text-xs text-emerald-400 font-mono animate-pulse">
                🎤 {voiceTranscript}
              </span>
            )}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={problemInput}
            onChange={(e) => setProblemInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type or build a LaTeX formula...  e.g.  \int x^2 dx"
            className="w-full bg-transparent border-none text-slate-100 font-mono text-base sm:text-lg outline-none placeholder-slate-500/60 py-1"
            id="formula-input"
            autoComplete="off"
            spellCheck={false}
          />

          {/* Live KaTeX render */}
          <div className="py-2 overflow-x-auto text-indigo-100 text-xl font-medium border-t border-slate-800/80 min-h-[2.5rem]">
            {problemInput.trim() ? (
              <MathRenderer content={`$$${problemInput}$$`} displayMode={true} />
            ) : (
              <span className="text-slate-600 text-sm font-sans">
                Formula preview will appear here...
              </span>
            )}
          </div>
        </div>

        {/* Error banner */}
        {(solveError || voiceError) && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs">
            <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{solveError || voiceError}</span>
          </div>
        )}

        {/* Action Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2">

            {/* Virtual Keyboard toggle */}
            <button
              type="button"
              id="btn-keyboard-toggle"
              onClick={() => setShowKeyboard((v) => !v)}
              title="Toggle Virtual Math Keyboard"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                showKeyboard
                  ? 'bg-indigo-500/20 border-indigo-500/60 text-indigo-300'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
              <span>Math Keyboard</span>
            </button>

            {/* Camera OCR */}
            <button
              type="button"
              id="btn-ocr-tool"
              onClick={() => setModalMode('ocr')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-indigo-400" />
              <span>Camera OCR</span>
            </button>

            {/* Drawing Pad */}
            <button
              type="button"
              id="btn-draw-tool"
              onClick={() => setModalMode('draw')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
            >
              <PenTool className="w-3.5 h-3.5 text-indigo-400" />
              <span>Drawing Pad</span>
            </button>

            {/* Voice Dictation */}
            <button
              type="button"
              id="btn-voice-input"
              onClick={toggleVoice}
              title={isListening ? 'Stop listening' : 'Start voice math dictation'}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                isListening
                  ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 animate-pulse'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-3.5 h-3.5 text-rose-400" />
                  <span>Stop Mic</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Voice Input</span>
                </>
              )}
            </button>

            {/* PDF Upload (Phase 4 placeholder) */}
            <button
              type="button"
              id="btn-pdf-upload"
              onClick={() => alert('PDF Homework Helper available in Phase 4')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
            >
              <FileUp className="w-3.5 h-3.5 text-indigo-400" />
              <span>PDF Upload</span>
            </button>
          </div>

          {/* Solve Button */}
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
                <Sparkles className="w-4 h-4" />
                <span>Solve</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* ===== VIRTUAL MATH KEYBOARD ===== */}
      <MathKeyboard
        isVisible={showKeyboard}
        onInsert={handleKeyboardInsert}
      />

      {/* ===== OCR MODAL ===== */}
      {modalMode === 'ocr' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#0d1424] border border-slate-700 rounded-3xl p-6 relative shadow-2xl">
            <button
              type="button"
              onClick={() => setModalMode('none')}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-sm transition-colors"
            >
              ✕ Close
            </button>
            <h3 className="text-base font-bold text-white mb-1">Camera Photo Math OCR</h3>
            <p className="text-xs text-slate-400 mb-4">
              Upload or drag a photo of your handwritten or printed equation. Gemini Vision will extract it as LaTeX.
            </p>
            <ImageUploader onExtractionSuccess={handleOcrSuccess} onError={(msg) => setSolveError(msg)} />
          </div>
        </div>
      )}

      {/* ===== DRAWING PAD MODAL ===== */}
      {modalMode === 'draw' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#0d1424] border border-slate-700 rounded-3xl p-6 relative shadow-2xl">
            <button
              type="button"
              onClick={() => setModalMode('none')}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-sm transition-colors"
            >
              ✕ Close
            </button>
            <h3 className="text-base font-bold text-white mb-1">Digital Ink Drawing Pad</h3>
            <p className="text-xs text-slate-400 mb-4">
              Handwrite your equation on the canvas below using mouse, touch, or stylus. Then click Transcribe to convert it.
            </p>
            <DrawingCanvas onExtractionSuccess={handleOcrSuccess} onError={(msg) => setSolveError(msg)} />
          </div>
        </div>
      )}

      {/* ===== SOLUTION + GRAPH AREA ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left: Step-by-Step Solution Card */}
        <div className="lg:col-span-7 bg-[#0d1424]/90 border border-slate-800/90 rounded-2xl p-6 shadow-xl space-y-5">

          {/* Method Tabs */}
          <div className="flex items-center gap-6 border-b border-slate-800 pb-3 text-xs sm:text-sm font-semibold">
            {(['step', 'alt1', 'alt2'] as const).map((tab, i) => (
              <button
                key={tab}
                type="button"
                id={`solution-tab-${tab}`}
                onClick={() => setActiveMethodTab(tab)}
                className={`pb-1 transition-all ${
                  activeMethodTab === tab
                    ? 'text-indigo-400 border-b-2 border-indigo-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {i === 0 ? 'Step-by-Step' : `Alternative Method ${i}`}
              </button>
            ))}
          </div>

          {/* Solution Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {isSolving ? 'Solving...' : solutionData ? 'Detailed Solution' : 'Step-by-Step Solution'}
            </h2>
            {solutionData?.is_symbolically_verified && !isSolving && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>SymPy Verified</span>
              </div>
            )}
          </div>

          {/* Solving spinner */}
          {isSolving && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
              <p className="text-sm text-slate-400">Running SymPy CAS engine...</p>
            </div>
          )}

          {/* Step-by-Step Tab */}
          {!isSolving && activeMethodTab === 'step' && (
            <div className="space-y-4 pt-1">
              {solutionData && solutionData.structured_steps.length > 0 ? (
                <>
                  {/* Final Answer Banner */}
                  <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-700/40 space-y-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400">Final Answer</div>
                    <div className="overflow-x-auto">
                      <MathRenderer content={`$$${solutionData.latex_solution}$$`} displayMode={true} />
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Computed in {solutionData.execution_time_ms}ms · Domain: {solutionData.domain}
                    </div>
                  </div>

                  {/* Steps */}
                  {solutionData.structured_steps.map((st) => (
                    <div key={st.step_number} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-900/60 border border-indigo-600/40 text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0 mt-1">
                        {st.step_number}
                      </div>
                      <div className="space-y-1 text-xs sm:text-sm text-slate-200 flex-1 min-w-0">
                        <div className="font-semibold text-slate-300">{st.description}</div>
                        {st.rule && (
                          <div className="text-[10px] text-violet-400 font-medium">Rule: {st.rule}</div>
                        )}
                        <div className="overflow-x-auto text-indigo-200 py-1 font-mono">
                          <MathRenderer content={`$$${st.latex}$$`} displayMode={false} />
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : !solutionData ? (
                // Default placeholder before solving
                <div className="space-y-4">
                  {[
                    {
                      n: 1,
                      desc: 'Step 1: Divide the integrand:',
                      math: '\\frac{3x^2 + 5x}{x^2 + 1} = 3 + \\frac{5x - 3}{x^2 + 1}',
                    },
                    {
                      n: 2,
                      desc: 'Step 2: Separate integrals:',
                      math: '\\int 3 dx + \\int \\frac{5x}{x^2 + 1} dx - \\int \\frac{3}{x^2 + 1} dx',
                    },
                    {
                      n: 3,
                      desc: 'Step 3: u-substitution: let u = x² + 1, du = 2x dx',
                      math: '',
                    },
                    {
                      n: 4,
                      desc: 'Step 4: Final Result:',
                      math: '3x + \\frac{5}{2}\\ln(x^2 + 1) - 3\\arctan(x) + C',
                    },
                  ].map((s) => (
                    <div key={s.n} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-900/60 border border-indigo-600/40 text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0 mt-1">
                        {s.n}
                      </div>
                      <div className="space-y-1 text-xs sm:text-sm text-slate-200">
                        <div className="font-semibold text-slate-300">{s.desc}</div>
                        {s.math && (
                          <div className="overflow-x-auto text-indigo-200 py-0.5">
                            <MathRenderer content={`$${s.math}$`} displayMode={false} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : solutionData && !solutionData.success ? (
                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40 space-y-3">
                  <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
                    <XCircle className="w-4 h-4 text-amber-400" />
                    <span>Solver Notice</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {solutionData.error || 'The symbolic engine could not compute steps for this input.'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Tips: Ensure balanced brackets, explicit operators (e.g. <code className="text-amber-200">2*x</code> or <code className="text-amber-200">x^2 + 44 = 0</code>), or use the virtual Math Keyboard below.
                  </p>
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-slate-500">
                  Backend returned no steps. Try a different expression.
                </div>
              )}
            </div>
          )}

          {/* Alternative Method 1 */}
          {!isSolving && activeMethodTab === 'alt1' && (
            <div className="p-4 rounded-xl bg-slate-950/60 text-xs text-slate-300 space-y-2">
              <span className="font-bold text-indigo-300">
                {problemInput.includes('=') || solutionData?.domain === 'equations'
                  ? 'Alternative Method: Direct Radical Isolation / Completing the Square'
                  : problemInput.includes('\\int') || solutionData?.domain === 'calculus'
                  ? 'Alternative Method: Algebraic / Trigonometric Substitution'
                  : 'Alternative Method: Direct Canonical Expansion'}
              </span>
              <p className="text-slate-400 leading-relaxed">
                {problemInput.includes('=') || solutionData?.domain === 'equations'
                  ? 'Rearrange the equation to isolate the primary variable or powers of x. By taking roots of both sides or completing the square, you directly evaluate the principal and conjugate roots without expanding full polynomials.'
                  : problemInput.includes('\\int') || solutionData?.domain === 'calculus'
                  ? 'Substitute x = tan(θ) or u = g(x), where dx = g\'(x) du, reducing the integrand via fundamental trigonometric or algebraic identities.'
                  : 'Expand all polynomial factors systematically into standard form and group like terms by degree.'}
              </p>
              {solutionData && solutionData.success && (
                <div className="mt-3 p-3 bg-indigo-950/30 border border-indigo-800/40 rounded-xl">
                  <div className="text-[10px] text-indigo-400 font-semibold mb-1">Result:</div>
                  <MathRenderer content={`$$${solutionData.latex_solution}$$`} displayMode={false} />
                </div>
              )}
            </div>
          )}

          {/* Alternative Method 2 */}
          {!isSolving && activeMethodTab === 'alt2' && (
            <div className="p-4 rounded-xl bg-slate-950/60 text-xs text-slate-300 space-y-2">
              <span className="font-bold text-indigo-300">
                {problemInput.includes('=') || solutionData?.domain === 'equations'
                  ? 'Alternative Method: Factoring Over the Complex Field ℂ'
                  : problemInput.includes('\\int') || solutionData?.domain === 'calculus'
                  ? 'Alternative Method: Partial Fraction Decomposition'
                  : 'Alternative Method: Horner\'s Rule / Synthetic Evaluation'}
              </span>
              <p className="text-slate-400 leading-relaxed">
                {problemInput.includes('=') || solutionData?.domain === 'equations'
                  ? 'Decompose the polynomial into linear factors over ℂ using the identity x² − r² = (x − r)(x + r) = 0. Setting each linear factor independently to zero yields the exact same root set.'
                  : problemInput.includes('\\int') || solutionData?.domain === 'calculus'
                  ? 'Express the rational component in linear and quadratic factors, integrate using logarithmic and arctangent differentials, and recombine to final canonical form.'
                  : 'Apply synthetic factoring and polynomial division to extract linear roots and irreducible components.'}
              </p>
              {solutionData && solutionData.success && (
                <div className="mt-3 p-3 bg-indigo-950/30 border border-indigo-800/40 rounded-xl">
                  <div className="text-[10px] text-indigo-400 font-semibold mb-1">Result:</div>
                  <MathRenderer content={`$$${solutionData.latex_solution}$$`} displayMode={false} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Graph Viewer — dynamic based on solved equation */}
        <div className="lg:col-span-5">
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
