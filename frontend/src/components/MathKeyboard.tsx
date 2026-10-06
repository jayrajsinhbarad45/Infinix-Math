'use client';

import React, { useState } from 'react';

export type KeyboardTab = 'basic' | 'algebra' | 'calculus' | 'trig' | 'greek';

interface MathKey {
  label: string;       // What shows on the key button
  latex: string;       // The LaTeX string to insert
  /** If true, cursor should land between the braces. e.g. \frac{|}{} */
  hasCursor?: boolean;
  title?: string;      // Tooltip
}

const KEYBOARD_TABS: { id: KeyboardTab; label: string }[] = [
  { id: 'basic',    label: 'Basic' },
  { id: 'algebra',  label: 'Algebra' },
  { id: 'calculus', label: 'Calculus' },
  { id: 'trig',     label: 'Trig' },
  { id: 'greek',    label: 'Greek' },
];

const KEYS: Record<KeyboardTab, MathKey[]> = {
  basic: [
    { label: '+',     latex: '+',         title: 'Addition' },
    { label: '−',     latex: '-',         title: 'Subtraction' },
    { label: '×',     latex: '\\times ',  title: 'Multiplication' },
    { label: '÷',     latex: '\\div ',    title: 'Division' },
    { label: '=',     latex: '=',         title: 'Equals' },
    { label: '≠',     latex: '\\neq ',    title: 'Not equal' },
    { label: '<',     latex: '<',         title: 'Less than' },
    { label: '>',     latex: '>',         title: 'Greater than' },
    { label: '≤',     latex: '\\leq ',    title: 'Less than or equal' },
    { label: '≥',     latex: '\\geq ',    title: 'Greater than or equal' },
    { label: '(',     latex: '(',         title: 'Open parenthesis' },
    { label: ')',     latex: ')',         title: 'Close parenthesis' },
    { label: '[',     latex: '[',         title: 'Open bracket' },
    { label: ']',     latex: ']',         title: 'Close bracket' },
    { label: '{',     latex: '\\{',       title: 'Open brace' },
    { label: '}',     latex: '\\}',       title: 'Close brace' },
    { label: '|x|',   latex: '|  |',      title: 'Absolute value' },
    { label: '±',     latex: '\\pm ',     title: 'Plus minus' },
    { label: '∞',     latex: '\\infty ',  title: 'Infinity' },
    { label: '%',     latex: '\\%',       title: 'Percent' },
  ],
  algebra: [
    { label: 'xⁿ',        latex: '^{}',            hasCursor: true, title: 'Power (exponent)' },
    { label: 'x²',        latex: '^{2}',            title: 'Square' },
    { label: 'x³',        latex: '^{3}',            title: 'Cube' },
    { label: 'xₙ',        latex: '_{n}',            title: 'Subscript' },
    { label: '√x',        latex: '\\sqrt{}',        hasCursor: true, title: 'Square root' },
    { label: '∛x',        latex: '\\sqrt[3]{}',     hasCursor: true, title: 'Cube root' },
    { label: 'ⁿ√x',       latex: '\\sqrt[n]{}',     hasCursor: true, title: 'nth root' },
    { label: 'a/b',       latex: '\\frac{}{}',      hasCursor: true, title: 'Fraction' },
    { label: 'log',       latex: '\\log',           title: 'Logarithm (base 10)' },
    { label: 'ln',        latex: '\\ln',            title: 'Natural log' },
    { label: 'logₐ',      latex: '\\log_{a}',       title: 'Log base a' },
    { label: 'eˣ',        latex: 'e^{}',            hasCursor: true, title: 'Exponential e^x' },
    { label: '|x|',       latex: '\\left|  \\right|', title: 'Absolute value (large)' },
    { label: 'f(x)',      latex: 'f(x)',            title: 'Function notation' },
    { label: 'x!',        latex: '!',              title: 'Factorial' },
    { label: 'nCr',       latex: '\\binom{n}{r}',   title: 'Binomial coefficient' },
    { label: '∑',         latex: '\\sum_{i=1}^{n}', title: 'Summation' },
    { label: '∏',         latex: '\\prod_{i=1}^{n}', title: 'Product notation' },
    { label: '→',         latex: '\\rightarrow ',   title: 'Arrow (implies)' },
    { label: '≈',         latex: '\\approx ',       title: 'Approximately equal' },
  ],
  calculus: [
    { label: 'd/dx',     latex: '\\frac{d}{dx}',                        title: 'Derivative' },
    { label: 'd²/dx²',   latex: '\\frac{d^2}{dx^2}',                    title: 'Second derivative' },
    { label: '∂/∂x',     latex: '\\frac{\\partial}{\\partial x}',        title: 'Partial derivative' },
    { label: '∫',        latex: '\\int',                                 title: 'Indefinite integral' },
    { label: '∫ₐᵇ',      latex: '\\int_{a}^{b}',                         title: 'Definite integral' },
    { label: '∬',        latex: '\\iint',                                title: 'Double integral' },
    { label: '∭',        latex: '\\iiint',                               title: 'Triple integral' },
    { label: '∮',        latex: '\\oint',                                title: 'Contour integral' },
    { label: 'lim',      latex: '\\lim_{x \\to }',                       title: 'Limit' },
    { label: 'lim x→∞',  latex: '\\lim_{x \\to \\infty}',               title: 'Limit as x approaches infinity' },
    { label: 'lim x→0',  latex: '\\lim_{x \\to 0}',                     title: 'Limit as x approaches 0' },
    { label: 'f\'(x)',    latex: "f'(x)",                                title: 'Lagrange notation f-prime' },
    { label: "f''(x)",   latex: "f''(x)",                               title: 'Second derivative Lagrange' },
    { label: 'Δ',        latex: '\\Delta',                              title: 'Delta (change)' },
    { label: '∇',        latex: '\\nabla',                              title: 'Nabla (gradient)' },
    { label: 'dx',       latex: '\\, dx',                               title: 'Differential dx' },
    { label: 'dt',       latex: '\\, dt',                               title: 'Differential dt' },
    { label: '→0',       latex: '\\to 0',                               title: 'Approaches 0' },
    { label: '→∞',       latex: '\\to \\infty',                         title: 'Approaches infinity' },
    { label: '+C',       latex: '+ C',                                  title: 'Constant of integration' },
  ],
  trig: [
    { label: 'sin',     latex: '\\sin',          title: 'Sine' },
    { label: 'cos',     latex: '\\cos',          title: 'Cosine' },
    { label: 'tan',     latex: '\\tan',          title: 'Tangent' },
    { label: 'csc',     latex: '\\csc',          title: 'Cosecant' },
    { label: 'sec',     latex: '\\sec',          title: 'Secant' },
    { label: 'cot',     latex: '\\cot',          title: 'Cotangent' },
    { label: 'sin⁻¹',   latex: '\\arcsin',       title: 'Arcsine (inverse sin)' },
    { label: 'cos⁻¹',   latex: '\\arccos',       title: 'Arccosine (inverse cos)' },
    { label: 'tan⁻¹',   latex: '\\arctan',       title: 'Arctangent (inverse tan)' },
    { label: 'sinh',    latex: '\\sinh',         title: 'Hyperbolic sine' },
    { label: 'cosh',    latex: '\\cosh',         title: 'Hyperbolic cosine' },
    { label: 'tanh',    latex: '\\tanh',         title: 'Hyperbolic tangent' },
    { label: 'π',       latex: '\\pi',           title: 'Pi constant (3.14159...)' },
    { label: '°',       latex: '^{\\circ}',      title: 'Degree symbol' },
    { label: 'rad',     latex: ' \\text{ rad}',  title: 'Radians label' },
    { label: '2π',      latex: '2\\pi',          title: '2 Pi (full rotation)' },
    { label: 'π/2',     latex: '\\frac{\\pi}{2}', title: 'Pi over 2 (90 degrees)' },
    { label: 'π/4',     latex: '\\frac{\\pi}{4}', title: 'Pi over 4 (45 degrees)' },
    { label: '√2/2',    latex: '\\frac{\\sqrt{2}}{2}', title: 'Root 2 over 2' },
    { label: 'e',       latex: 'e',              title: 'Euler number (2.718...)' },
  ],
  greek: [
    { label: 'α',  latex: '\\alpha ',    title: 'Alpha' },
    { label: 'β',  latex: '\\beta ',     title: 'Beta' },
    { label: 'γ',  latex: '\\gamma ',    title: 'Gamma (lowercase)' },
    { label: 'Γ',  latex: '\\Gamma ',    title: 'Gamma (uppercase)' },
    { label: 'δ',  latex: '\\delta ',    title: 'Delta (lowercase)' },
    { label: 'Δ',  latex: '\\Delta ',    title: 'Delta (uppercase)' },
    { label: 'ε',  latex: '\\epsilon ',  title: 'Epsilon' },
    { label: 'ζ',  latex: '\\zeta ',     title: 'Zeta' },
    { label: 'η',  latex: '\\eta ',      title: 'Eta' },
    { label: 'θ',  latex: '\\theta ',    title: 'Theta (lowercase)' },
    { label: 'Θ',  latex: '\\Theta ',    title: 'Theta (uppercase)' },
    { label: 'λ',  latex: '\\lambda ',   title: 'Lambda (lowercase)' },
    { label: 'Λ',  latex: '\\Lambda ',   title: 'Lambda (uppercase)' },
    { label: 'μ',  latex: '\\mu ',       title: 'Mu' },
    { label: 'ν',  latex: '\\nu ',       title: 'Nu' },
    { label: 'ξ',  latex: '\\xi ',       title: 'Xi' },
    { label: 'π',  latex: '\\pi ',       title: 'Pi' },
    { label: 'ρ',  latex: '\\rho ',      title: 'Rho' },
    { label: 'σ',  latex: '\\sigma ',    title: 'Sigma (lowercase)' },
    { label: 'Σ',  latex: '\\Sigma ',    title: 'Sigma (uppercase / summation)' },
    { label: 'τ',  latex: '\\tau ',      title: 'Tau' },
    { label: 'φ',  latex: '\\phi ',      title: 'Phi (lowercase)' },
    { label: 'Φ',  latex: '\\Phi ',      title: 'Phi (uppercase)' },
    { label: 'χ',  latex: '\\chi ',      title: 'Chi' },
    { label: 'ψ',  latex: '\\psi ',      title: 'Psi (lowercase)' },
    { label: 'Ψ',  latex: '\\Psi ',      title: 'Psi (uppercase)' },
    { label: 'ω',  latex: '\\omega ',    title: 'Omega (lowercase)' },
    { label: 'Ω',  latex: '\\Omega ',    title: 'Omega (uppercase)' },
    { label: '∀',  latex: '\\forall ',   title: 'For all' },
    { label: '∃',  latex: '\\exists ',   title: 'There exists' },
  ],
};

interface MathKeyboardProps {
  /** Called when a key is pressed. Receives the LaTeX string to insert and whether it has a cursor placeholder. */
  onInsert: (latex: string, hasCursor: boolean) => void;
  isVisible: boolean;
}

export const MathKeyboard: React.FC<MathKeyboardProps> = ({ onInsert, isVisible }) => {
  const [activeTab, setActiveTab] = useState<KeyboardTab>('basic');

  if (!isVisible) return null;

  return (
    <div
      id="math-virtual-keyboard"
      className="w-full bg-[#0d1424]/95 border border-indigo-500/30 rounded-2xl p-3 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl animate-in slide-in-from-bottom-2 duration-200"
    >
      {/* Tab Bar */}
      <div className="flex items-center gap-1 pb-2.5 border-b border-slate-800/80 overflow-x-auto no-scrollbar">
        {KEYBOARD_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            id={`keyboard-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-indigo-500/90 to-violet-600/90 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Key Grid */}
      <div className="pt-2.5 grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
        {KEYS[activeTab].map((key, i) => (
          <button
            key={`${activeTab}-${i}`}
            type="button"
            title={key.title}
            onClick={() => onInsert(key.latex, key.hasCursor ?? false)}
            className="flex items-center justify-center h-9 px-1.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-200 text-xs sm:text-sm font-mono font-medium hover:bg-indigo-500/20 hover:border-indigo-500/60 hover:text-white active:scale-95 transition-all cursor-pointer select-none shadow-sm"
          >
            {key.label}
          </button>
        ))}
      </div>

      {/* Hint */}
      <div className="pt-2.5 text-[10px] text-slate-500 text-center border-t border-slate-800/80 mt-2">
        Click any key to insert LaTeX into the formula bar above
      </div>
    </div>
  );
};

export default MathKeyboard;
