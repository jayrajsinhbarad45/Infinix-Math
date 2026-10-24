'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Film,
  HelpCircle,
  Keyboard,
  Layers,
  Loader2,
  Maximize2,
  Mic,
  Play,
  RotateCcw,
  Share2,
  Sparkles,
  Star,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  Video,
  Volume2,
  X,
} from 'lucide-react';
import MathRenderer from './MathRenderer';
import GraphViewer from './GraphViewer';
import MathKeyboard from './MathKeyboard';
import { generateManimVideo, ManimVideoResponse, solveMathProblem } from '../lib/api';
import { MathStep, SolveResponse } from '../lib/types';

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

export const SolverWorkspace: React.FC = () => {
  const [problemInput, setProblemInput] = useState('5x^2 + 9x + 1 = 0');
  const [activeProblem, setActiveProblem] = useState('5x^2 + 9x + 1 = 0');
  const [isSolving, setIsSolving] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [solutionData, setSolutionData] = useState<SolveResponse | null>(null);
  const [solveError, setSolveError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);
  const [starred, setStarred] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Accordion states matching Mathos AI
  const [showConcept, setShowConcept] = useState(false);
  const [similarOpen, setSimilarOpen] = useState(true);
  const [videosOpen, setVideosOpen] = useState(false);
  const [graphExpanded, setGraphExpanded] = useState(false);

  // Manim Video Explainer state
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoStepText, setVideoStepText] = useState('Initializing video explainer...');
  const [videoData, setVideoData] = useState<ManimVideoResponse | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const graphSectionRef = useRef<HTMLDivElement>(null);

  // -------------------------------------------------------------------------
  // Solve math problem
  // -------------------------------------------------------------------------
  const handleSolve = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? problemInput).trim();
    if (!text) return;

    setActiveProblem(text);
    setIsSolving(true);
    setSolveError(null);
    setVideoData(null);

    // Save to localStorage history (Mathos AI "Today" history feature)
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('infinix_solve_history');
        const list: string[] = raw ? JSON.parse(raw) : [];
        const filtered = [text, ...list.filter((x) => x !== text)].slice(0, 10);
        localStorage.setItem('infinix_solve_history', JSON.stringify(filtered));
        window.dispatchEvent(new Event('infinix_history_updated'));
      } catch {}
    }

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

  // Initial solve on mount
  useEffect(() => {
    handleSolve('5x^2 + 9x + 1 = 0');
  }, []);

  // Listen for external history selection from AppShell
  useEffect(() => {
    const handleLoadEquation = (e: Event) => {
      const custom = e as CustomEvent<string>;
      if (custom.detail) {
        setProblemInput(custom.detail);
        handleSolve(custom.detail);
      }
    };
    window.addEventListener('infinix_load_equation', handleLoadEquation);
    return () => window.removeEventListener('infinix_load_equation', handleLoadEquation);
  }, [handleSolve]);

  // -------------------------------------------------------------------------
  // Video Explainer Generator
  // -------------------------------------------------------------------------
  const handleGenerateVideo = async () => {
    setShowVideoModal(true);
    if (videoData) return; // already rendered for this problem

    setVideoLoading(true);
    setVideoError(null);
    setVideoStepText('Synthesizing natural AI voice explanation...');

    const timer1 = setTimeout(() => {
      setVideoStepText('Generating 3Blue1Brown vector step animations in Manim...');
    }, 3000);

    const timer2 = setTimeout(() => {
      setVideoStepText('Rendering coordinate graph with tangent curve and roots...');
    }, 9000);

    const timer3 = setTimeout(() => {
      setVideoStepText('Multiplexing audio and video into 1080p MP4...');
    }, 15000);

    try {
      const steps = solutionData?.structured_steps?.map((s) => ({
        step_number: s.step_number,
        description: s.description,
        latex: s.latex,
      }));

      const res = await generateManimVideo({
        problem_text: activeProblem,
        solution_latex: solutionData?.latex_solution,
        steps: steps,
      });

      setVideoData(res);
    } catch (err: unknown) {
      setVideoError(err instanceof Error ? err.message : 'Video rendering failed');
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setVideoLoading(false);
    }
  };

  // Math keyboard insertion
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
        if (braceIndex !== -1) cursorPos = start + braceIndex + 1;
      }
      input.setSelectionRange(cursorPos, cursorPos);
    });
  };

  // Voice speech-to-text recognition
  const handleVoiceInput = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. Please type your equation.');
      return;
    }

    if (isListening) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);
      recognition.onresult = (event: any) => {
        const spoken = event.results[0][0].transcript;
        if (spoken) {
          // Convert common spoken math to formula text
          const cleaned = spoken
            .replace(/\bsquared\b/gi, '^2')
            .replace(/\bcubed\b/gi, '^3')
            .replace(/\bplus\b/gi, '+')
            .replace(/\bminus\b/gi, '-')
            .replace(/\bequals\b/gi, '=')
            .replace(/\bequal to\b/gi, '=')
            .replace(/\btimes\b/gi, '*');
          setProblemInput(cleaned);
          handleSolve(cleaned);
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Copy solution
  const handleCopy = () => {
    const textToCopy = solutionData
      ? `Problem: ${activeProblem}\nSolution: ${solutionData.latex_solution}`
      : activeProblem;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Share problem
  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  // Scroll to graph
  const scrollToGraph = () => {
    graphSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const graphFormula = getGraphFormulaLabel(activeProblem);

  return (
    <div className="w-full max-w-7xl mx-auto pb-28 antialiased select-none text-slate-900">

      {/* Main 2-Column Responsive Layout matching Mathos AI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ----------------------------------------------------------------- */}
        {/* CENTER COLUMN: Question Card, Solution, Derivations, Action Bar  */}
        {/* ----------------------------------------------------------------- */}
        <div className="lg:col-span-8 space-y-5">

          {/* User Question Box */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-[#00a8ff] font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
              U
            </div>
            <div className="flex-1 font-mono text-base font-semibold text-slate-800 overflow-x-auto py-1">
              {activeProblem}
            </div>
          </div>

          {/* AI Solution Card matching Mathos AI */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">

            {/* Solution Header with Mascot & Title */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00a8ff] to-[#38bdf8] flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-[#00a8ff] tracking-tight">Solution</h2>
                  <p className="text-xs text-slate-400 font-medium">Verified by Infinix Math Symbolic CAS</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSolve(activeProblem)}
                title="Re-solve Problem"
                disabled={isSolving}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <RotateCcw className={`w-4 h-4 ${isSolving ? 'animate-spin text-[#00a8ff]' : ''}`} />
              </button>
            </div>

            {/* Loading Skeleton */}
            {isSolving && (
              <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin text-[#00a8ff]" />
                <span className="text-sm font-semibold">Computing deterministic symbolic solution...</span>
              </div>
            )}

            {/* Error Notice */}
            {solveError && !isSolving && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
                {solveError}
              </div>
            )}

            {/* Solution Content Stream */}
            {!isSolving && solutionData && (
              <div className="space-y-6">

                {/* Problem Restatement */}
                <div className="space-y-1 text-slate-600 text-sm">
                  <span className="font-semibold text-slate-400">Solve:</span>
                  <div className="text-base font-medium py-1">
                    <MathRenderer content={`$$${activeProblem}$$`} displayMode={false} />
                  </div>
                </div>

                {/* Step-by-Step Derivation Flow */}
                {solutionData.structured_steps && solutionData.structured_steps.length > 0 ? (
                  <div className="space-y-4 pt-2">
                    {solutionData.structured_steps.map((st, idx) => (
                      <div key={idx} className="space-y-2">
                        {/* Step Description */}
                        {st.description && (
                          <div className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#00a8ff]"></span>
                            <MathRenderer content={st.description} displayMode={false} />
                          </div>
                        )}

                        {/* Step Formula */}
                        {st.latex && (
                          <div className="pl-4 py-1 text-base overflow-x-auto text-slate-900 font-medium">
                            <MathRenderer content={`$$${st.latex}$$`} displayMode={true} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Fallback to raw latex_solution if no steps */
                  <div className="py-2 text-base overflow-x-auto">
                    <MathRenderer content={`$$${solutionData.latex_solution}$$`} displayMode={true} />
                  </div>
                )}

                {/* Boxed Final Solution Card */}
                {solutionData.latex_solution && (
                  <div className="pt-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Verified Result
                    </p>
                    <div className="p-4 rounded-2xl bg-sky-50/60 border-2 border-[#00a8ff]/40 shadow-xs flex items-center justify-center overflow-x-auto">
                      <MathRenderer
                        content={`$$${solutionData.latex_solution}$$`}
                        displayMode={true}
                        className="text-lg font-bold text-slate-900"
                      />
                    </div>
                  </div>
                )}

                {/* Concept Expansion Accordion ("Want to learn more about this concept?") */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowConcept(!showConcept)}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 text-sky-800 text-xs font-bold hover:bg-sky-100/60 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#00a8ff]" />
                      Want to learn more about this concept?
                    </span>
                    {showConcept ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 text-sky-600" />}
                  </button>

                  {showConcept && (
                    <div className="mt-2 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-2 animate-in fade-in duration-200">
                      <p className="font-semibold text-slate-800">
                        Understanding the Quadratic Formula & Discriminant:
                      </p>
                      <p>
                        A quadratic equation in standard form is written as <strong>$ax^2 + bx + c = 0$</strong>, where $a \neq 0$.
                        The roots are determined by the quadratic formula:
                      </p>
                      <div className="py-1">
                        <MathRenderer content="$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$" displayMode={false} />
                      </div>
                      <p>
                        The term <strong>$D = b^2 - 4ac$</strong> is called the <em>discriminant</em>:
                      </p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li><strong>$D &gt; 0$:</strong> Two distinct real solutions (parabola intersects x-axis twice).</li>
                        <li><strong>$D = 0$:</strong> One repeated real solution (parabola touches x-axis at vertex).</li>
                        <li><strong>$D &lt; 0$:</strong> Two complex conjugate solutions with imaginary unit $i$.</li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Bottom Action Ribbon matching Mathos AI */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">

                  {/* Left Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => alert('Flashcards generated for ' + activeProblem)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      <span>Create Flashcards</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => alert('Practice Quiz generated for ' + activeProblem)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                      <span>Create Quiz</span>
                    </button>

                    {/* Mathos AI Video Generation Button */}
                    <button
                      type="button"
                      id="btn-video-generation"
                      onClick={handleGenerateVideo}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#00a8ff] to-[#0284c7] hover:from-[#0096e6] hover:to-[#0369a1] text-white text-xs font-bold shadow-md shadow-sky-500/20 active:scale-95 transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Video Generation</span>
                    </button>

                    <button
                      type="button"
                      onClick={scrollToGraph}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#00a8ff] text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Generate Graph</span>
                    </button>
                  </div>

                  {/* Right Action Icons (Share, Copy, Favorite, Feedback) */}
                  <div className="flex items-center gap-1 text-slate-400">
                    <button
                      type="button"
                      onClick={handleShare}
                      title="Share Question Link"
                      className="p-2 rounded-lg hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {shared ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={handleCopy}
                      title="Copy LaTeX Solution"
                      className="p-2 rounded-lg hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setStarred(!starred)}
                      title="Save to Favorites"
                      className={`p-2 rounded-lg transition-colors cursor-pointer ${
                        starred ? 'text-amber-500 bg-amber-50' : 'hover:text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${starred ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setLiked(liked === true ? null : true)}
                      title="Helpful Solution"
                      className={`p-2 rounded-lg transition-colors cursor-pointer ${
                        liked === true ? 'text-emerald-600 bg-emerald-50' : 'hover:text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setLiked(liked === false ? null : false)}
                      title="Not Helpful"
                      className={`p-2 rounded-lg transition-colors cursor-pointer ${
                        liked === false ? 'text-rose-600 bg-rose-50' : 'hover:text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </div>

                </div>

              </div>
            )}

          </div>

        </div>

        {/* ----------------------------------------------------------------- */}
        {/* RIGHT COLUMN: Interactive Graph & Context Accordions              */}
        {/* ----------------------------------------------------------------- */}
        <div className="lg:col-span-4 space-y-4">

          {/* Accordion 1: Similar Questions */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setSimilarOpen(!similarOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/80 hover:bg-slate-100/70 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
            >
              <span>Similar Questions</span>
              {similarOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>

            {similarOpen && (
              <div className="p-3 space-y-1.5 divide-y divide-slate-100 text-xs">
                {[
                  { q: '3x^2 - 7x + 2 = 0', desc: 'Distinct rational roots' },
                  { q: 'x^2 - 6x + 9 = 0', desc: 'Perfect square repeated root' },
                  { q: '2x^2 + 4x + 5 = 0', desc: 'Complex conjugate roots' },
                ].map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setProblemInput(item.q);
                      handleSolve(item.q);
                    }}
                    className="w-full text-left pt-2 first:pt-0 pb-1 px-2 rounded-lg hover:bg-sky-50 text-slate-700 hover:text-[#00a8ff] transition-all cursor-pointer block"
                  >
                    <div className="font-mono font-bold">{item.q}</div>
                    <div className="text-[10px] text-slate-400">{item.desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Accordion 2: Related Explainer Videos */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setVideosOpen(!videosOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/80 hover:bg-slate-100/70 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
            >
              <span>Related Explainer Videos</span>
              {videosOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>

            {videosOpen && (
              <div className="p-3 space-y-2 text-xs">
                {[
                  { title: 'Quadratic Formula Derivation', duration: '1:45', tag: 'Algebra' },
                  { title: 'Discriminant Visualized on Graph', duration: '2:10', tag: 'Graphing' },
                ].map((vid, idx) => (
                  <div
                    key={idx}
                    onClick={handleGenerateVideo}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-100 hover:border-sky-200 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-sky-100 text-[#00a8ff] flex items-center justify-center">
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 truncate">{vid.title}</div>
                        <div className="text-[10px] text-slate-400">{vid.tag} &bull; {vid.duration}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Accordion 3 / Widget: Interactive Graph Canvas */}
          <div
            ref={graphSectionRef}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 border-b border-slate-100 text-slate-800 text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#00a8ff]" />
                Interactive Graph
              </span>
              <button
                type="button"
                onClick={() => setGraphExpanded(!graphExpanded)}
                className="text-[11px] text-[#00a8ff] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Maximize2 className="w-3 h-3" />
                {graphExpanded ? 'Zoom Out' : 'Zoom In'}
              </button>
            </div>

            <div className="p-3 bg-white">
              <GraphViewer
                formulaLabel={graphFormula}
                inputExpression={activeProblem}
                solvedLatex={solutionData?.latex_solution}
              />
            </div>
          </div>

        </div>

      </div>

      {/* ----------------------------------------------------------------- */}
      {/* FLOATING STICKY BOTTOM INPUT BAR matching Mathos AI               */}
      {/* ----------------------------------------------------------------- */}
      <div className="fixed bottom-4 left-0 right-0 z-40 px-4 flex justify-center pointer-events-none">
        <div className="w-full max-w-3xl pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl shadow-sky-950/15 p-2 flex items-center gap-2 transition-all">

          {/* Camera OCR Button */}
          <button
            type="button"
            title="Scan Problem from Image"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl text-slate-500 hover:text-[#00a8ff] hover:bg-sky-50 transition-colors cursor-pointer shrink-0"
          >
            <Camera className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                alert('Image selected: OCR parsing equation...');
              }
            }}
          />

          {/* Math Keyboard Button */}
          <button
            type="button"
            title="Toggle Math Keyboard"
            onClick={() => setShowKeyboard(!showKeyboard)}
            className={`p-2.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
              showKeyboard ? 'bg-[#00a8ff] text-white shadow-xs' : 'text-slate-500 hover:text-[#00a8ff] hover:bg-sky-50'
            }`}
          >
            <Keyboard className="w-5 h-5" />
          </button>

          {/* Voice Microphone Button */}
          <button
            type="button"
            title="Speak Equation"
            onClick={handleVoiceInput}
            className={`p-2.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
              isListening ? 'bg-rose-500 text-white animate-pulse' : 'text-slate-500 hover:text-[#00a8ff] hover:bg-sky-50'
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Equation Input */}
          <input
            ref={inputRef}
            type="text"
            value={problemInput}
            onChange={(e) => setProblemInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSolve();
            }}
            placeholder="Type text, or paste equation... (e.g. 5x^2 + 9x + 1 = 0)"
            className="flex-1 bg-transparent border-none text-slate-900 font-mono text-sm sm:text-base outline-none placeholder-slate-400 px-1"
          />

          {/* Send Solve Button */}
          <button
            type="button"
            onClick={() => handleSolve()}
            disabled={isSolving || !problemInput.trim()}
            className="px-4 py-2.5 rounded-xl bg-[#00a8ff] hover:bg-[#0096e6] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-sky-500/20 active:scale-95 disabled:opacity-50 transition-all cursor-pointer shrink-0"
          >
            {isSolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            <span className="hidden sm:inline">Send</span>
          </button>

        </div>
      </div>

      {/* Math Virtual Keyboard Drawer */}
      {showKeyboard && (
        <div className="fixed bottom-20 left-4 right-4 z-40 max-w-2xl mx-auto animate-in slide-in-from-bottom duration-200">
          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Mathematical Symbols
              </span>
              <button
                type="button"
                onClick={() => setShowKeyboard(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <MathKeyboard onInsert={handleKeyboardInsert} isVisible={showKeyboard} />
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* MATHOS AI VIDEO EXPLAINER MODAL                                   */}
      {/* ----------------------------------------------------------------- */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 tracking-wide">
                    Algebra II &bull; Quadratic Formula
                  </span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  Solving {activeProblem}
                </h3>
                <ul className="text-xs text-slate-500 space-y-0.5 pt-1">
                  <li>&bull; standard form identification and coefficients</li>
                  <li>&bull; radical discriminant simplification</li>
                  <li>&bull; coordinate roots and tangent curve animation</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Loading State OR HTML5 Video Player */}
            <div className="p-6">
              {videoLoading && (
                <div className="py-14 flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-[#00a8ff]">
                      <Film className="w-8 h-8 text-[#00a8ff] animate-pulse" />
                    </div>
                    <Loader2 className="w-6 h-6 animate-spin text-[#00a8ff] absolute -top-1 -right-1" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-bold text-slate-800">Generating Manim Explainer Video</p>
                    <p className="text-xs text-sky-600 font-semibold">{videoStepText}</p>
                  </div>
                  <div className="w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#00a8ff] to-[#38bdf8] animate-pulse w-3/4"></div>
                  </div>
                </div>
              )}

              {videoError && !videoLoading && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-3">
                  <p className="text-sm font-semibold text-rose-700">{videoError}</p>
                  <button
                    type="button"
                    onClick={handleGenerateVideo}
                    className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs uppercase cursor-pointer hover:bg-rose-700 transition-colors"
                  >
                    Retry Generation
                  </button>
                </div>
              )}

              {videoData && !videoLoading && (
                <div className="space-y-4">
                  {/* Embedded MP4 Player */}
                  <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-900 bg-black aspect-video flex items-center justify-center">
                    <video
                      controls
                      autoPlay
                      playsInline
                      src={videoData.url}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Actions & Meta */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="text-xs text-slate-500 font-medium">
                      Duration: <span className="font-bold text-slate-800">{videoData.duration_seconds}s</span> &bull; 3Blue1Brown Manim Animation + AI Voice
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={videoData.url}
                        download={`infinix_math_${videoData.video_id}.mp4`}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00a8ff] hover:bg-[#0096e6] text-white text-xs font-bold shadow-md shadow-sky-500/20 transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download MP4</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 text-center">
              Rendered via Manim 3Blue1Brown Engine &bull; Neural Speech Narration &bull; Infinix Math CAS
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default SolverWorkspace;
