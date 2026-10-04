'use client';

import React from 'react';

interface MathToolbarProps {
  onInsert: (snippet: string) => void;
}

interface SymbolGroup {
  label: string;
  items: { label: string; snippet: string; description: string }[];
}

const SYMBOL_GROUPS: SymbolGroup[] = [
  {
    label: 'Calculus',
    items: [
      { label: 'd/dx', snippet: '\\frac{d}{dx}(', description: 'Derivative' },
      { label: '∫ dx', snippet: '\\int ', description: 'Indefinite Integral' },
      { label: '∫ₐᵇ', snippet: '\\int_{0}^{1} ', description: 'Definite Integral' },
      { label: '∂/∂y', snippet: '\\frac{\\partial}{\\partial y}(', description: 'Partial Derivative' },
      { label: 'lim', snippet: '\\lim_{x \\to 0}', description: 'Limit' },
    ],
  },
  {
    label: 'Algebra',
    items: [
      { label: 'a/b', snippet: '\\frac{a}{b}', description: 'Fraction' },
      { label: '√x', snippet: '\\sqrt{x}', description: 'Square Root' },
      { label: 'ⁿ√x', snippet: '\\sqrt[3]{x}', description: 'Nth Root' },
      { label: 'xⁿ', snippet: '^{2}', description: 'Exponent' },
      { label: 'xₙ', snippet: '_{n}', description: 'Subscript' },
      { label: '±', snippet: '\\pm ', description: 'Plus-Minus' },
      { label: '·', snippet: '\\cdot ', description: 'Multiplication Dot' },
    ],
  },
  {
    label: 'Functions',
    items: [
      { label: 'sin', snippet: '\\sin(', description: 'Sine' },
      { label: 'cos', snippet: '\\cos(', description: 'Cosine' },
      { label: 'tan', snippet: '\\tan(', description: 'Tangent' },
      { label: 'ln', snippet: '\\ln(', description: 'Natural Log' },
      { label: 'log', snippet: '\\log(', description: 'Logarithm' },
      { label: 'eˣ', snippet: 'e^{x}', description: 'Exponential' },
    ],
  },
  {
    label: 'Symbols',
    items: [
      { label: 'π', snippet: '\\pi', description: 'Pi' },
      { label: 'θ', snippet: '\\theta', description: 'Theta' },
      { label: '∞', snippet: '\\infty', description: 'Infinity' },
      { label: '≤', snippet: '\\le ', description: 'Less Than or Equal' },
      { label: '≥', snippet: '\\ge ', description: 'Greater Than or Equal' },
      { label: '≠', snippet: '\\neq ', description: 'Not Equal' },
    ],
  },
];

export const MathToolbar: React.FC<MathToolbarProps> = ({ onInsert }) => {
  return (
    <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800/80 shadow-inner">
      {SYMBOL_GROUPS.map((group) => (
        <div key={group.label} className="flex items-center gap-1">
          <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-500 px-1 hidden sm:inline">
            {group.label}
          </span>
          <div className="flex items-center gap-1 bg-slate-800/40 p-1 rounded-lg border border-slate-700/40">
            {group.items.map((item) => (
              <button
                key={item.label}
                type="button"
                id={`btn-symbol-${item.label.replace(/[^a-zA-Z0-9]/g, '')}`}
                onClick={() => onInsert(item.snippet)}
                title={item.description}
                className="px-2 py-1 text-xs font-mono font-medium text-slate-300 hover:text-white bg-slate-800/70 hover:bg-indigo-600/60 hover:border-indigo-500/50 rounded border border-slate-700/50 transition-all duration-150 active:scale-95 shadow-sm"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MathToolbar;
