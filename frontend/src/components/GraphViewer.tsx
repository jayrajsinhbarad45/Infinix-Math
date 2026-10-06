'use client';

import React, { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import MathRenderer from './MathRenderer';

interface GraphViewerProps {
  formulaLabel?: string;
  /** The raw LaTeX solution returned by the backend solver */
  solvedLatex?: string;
  /** The user's raw input expression (fallback) */
  inputExpression?: string;
}

// ---------------------------------------------------------------------------
// Safe JavaScript expression evaluator from LaTeX / plain math string
// ---------------------------------------------------------------------------

/**
 * Converts a simple LaTeX / plain math expression into a JavaScript-evaluable
 * string, then wraps it in a safe Function to evaluate f(x).
 */
function latexToJsFunc(raw: string): { fn: (x: number) => number; cleanLatex: string } | null {
  try {
    let expr = raw.trim();

    // Ignore known error text strings
    if (/\\text\{.*?(Error|Unable|Notice).*?\}/i.test(expr) || /Internal solver error/i.test(expr)) {
      return null;
    }

    // Strip common LaTeX wrappers
    expr = expr.replace(/\\\[|\\\]|\$\$|\$/g, '');

    // Strip differential calculus notation: \frac{d}{dx}(expr) -> expr
    expr = expr.replace(/\\frac\{d\}\{dx\}\s*\(?(.*?)\)?$/g, '$1');
    expr = expr.replace(/d\/dx\s*\(?(.*?)\)?$/g, '$1');

    // Strip integral notation: \int expr dx -> expr
    expr = expr.replace(/\\int(?:_\{[^}]+\}\^\{[^}]+\})?\s*(.*?)(?:d[a-zA-Z])?$/g, '$1');
    expr = expr.replace(/dx$/g, '');

    // If input is an equation: LHS = RHS, plot y = LHS - RHS (or just LHS if RHS is 0)
    let cleanLatex = raw;
    if (expr.includes('=')) {
      const parts = expr.split('=');
      // If multiple '=' or imaginary solutions (e.g. roots output 'x = 2, x = 3'), not a plottable curve
      if (parts.length > 2 || /\bi\b/.test(expr)) {
        return null;
      }
      const lhs = parts[0].trim();
      const rhs = parts[1].trim();
      cleanLatex = rhs === '0' || !rhs ? lhs : `${lhs} - (${rhs})`;
      expr = rhs === '0' || !rhs ? lhs : `(${lhs}) - (${rhs})`;
    }

    // Replace \frac{a}{b} → (a)/(b)
    expr = expr.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)');

    // Replace powers x^{n} → Math.pow(x,n) or x**n
    expr = expr.replace(/\^{([^{}]+)}/g, '**($1)');
    expr = expr.replace(/\^(\d+)/g, '**$1');

    // Constants
    expr = expr.replace(/\\pi/g, 'Math.PI');
    expr = expr.replace(/\\infty/g, 'Infinity');
    expr = expr.replace(/\be\b/g, 'Math.E');

    // Trig
    expr = expr.replace(/\\arctan/g, 'Math.atan');
    expr = expr.replace(/\\arcsin/g, 'Math.asin');
    expr = expr.replace(/\\arccos/g, 'Math.acos');
    expr = expr.replace(/\\sin/g, 'Math.sin');
    expr = expr.replace(/\\cos/g, 'Math.cos');
    expr = expr.replace(/\\tan/g, 'Math.tan');
    expr = expr.replace(/\\sinh/g, 'Math.sinh');
    expr = expr.replace(/\\cosh/g, 'Math.cosh');
    expr = expr.replace(/\\tanh/g, 'Math.tanh');

    // Log
    expr = expr.replace(/\\ln/g, 'Math.log');
    expr = expr.replace(/\\log_{([^{}]+)}\(([^)]+)\)/g, '(Math.log($2)/Math.log($1))');
    expr = expr.replace(/\\log/g, 'Math.log10');

    // Sqrt
    expr = expr.replace(/\\sqrt\[3\]\{([^{}]+)\}/g, 'Math.cbrt($1)');
    expr = expr.replace(/\\sqrt\{([^{}]+)\}/g, 'Math.sqrt($1)');
    expr = expr.replace(/\\sqrt/g, 'Math.sqrt');

    // Absolute value
    expr = expr.replace(/\\left\|/g, 'Math.abs(');
    expr = expr.replace(/\\right\|/g, ')');
    expr = expr.replace(/\|([^|]+)\|/g, 'Math.abs($1)');

    // Remove \, (thin space), \left, \right, \cdot
    expr = expr.replace(/\\,|\\left|\\right|\\cdot/g, ' ');

    // Remove + C (constant of integration)
    expr = expr.replace(/\+\s*C\b/g, '');

    // Remove remaining backslashes from unknown commands
    expr = expr.replace(/\\[a-zA-Z]+/g, '');

    // Remove curly braces (LaTeX grouping)
    expr = expr.replace(/[{}]/g, '');

    // Implicit multiplication: 2x → 2*x, 3(x → 3*(x
    expr = expr.replace(/(\d)([a-zA-Z(])/g, '$1*$2');
    expr = expr.replace(/([a-zA-Z)])(\d)/g, '$1*$2');
    expr = expr.replace(/\)(\()/g, ')*(');

    // Validate — must contain x somewhere and no unsafe characters
    if (!expr.includes('x')) return null;
    if (/[;`]/.test(expr)) return null;

    // eslint-disable-next-line no-new-func
    const fn = new Function('x', `
      'use strict';
      try {
        const result = ${expr};
        return (typeof result === 'number' && isFinite(result)) ? result : null;
      } catch(e) { return null; }
    `) as (x: number) => number | null;

    // Quick sanity test at a few points
    const testPoints = [0, 1, -1, 2];
    const hasValidPoint = testPoints.some((p) => {
      const v = fn(p);
      return v !== null && !isNaN(v);
    });
    if (!hasValidPoint) return null;

    return {
      fn: (x: number) => {
        const v = fn(x);
        return v !== null ? v : NaN;
      },
      cleanLatex,
    };
  } catch {
    return null;
  }
}

/**
 * Builds an SVG path string from a numeric function across the domain [xMin, xMax].
 */
function buildPath(
  fn: (x: number) => number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  width: number,
  height: number,
  steps = 300
): string {
  const toSvgX = (x: number) => ((x - xMin) / (xMax - xMin)) * width;
  const toSvgY = (y: number) => height - ((y - yMin) / (yMax - yMin)) * height;

  const points: string[] = [];
  let lastValid = true;

  for (let i = 0; i <= steps; i++) {
    const x = xMin + (i / steps) * (xMax - xMin);
    const y = fn(x);

    if (!isNaN(y) && isFinite(y) && y >= yMin - 10 && y <= yMax + 10) {
      const sx = toSvgX(x).toFixed(1);
      const sy = toSvgY(Math.max(yMin, Math.min(yMax, y))).toFixed(1);
      points.push(`${lastValid === false ? 'M' : points.length === 0 ? 'M' : 'L'} ${sx} ${sy}`);
      lastValid = true;
    } else {
      // Discontinuity — lift pen
      lastValid = false;
    }
  }

  return points.join(' ');
}

export const GraphViewer: React.FC<GraphViewerProps> = ({
  formulaLabel,
  solvedLatex,
  inputExpression,
}) => {
  const width = 380;
  const height = 340;
  const xMin = -4.5;
  const xMax = 4.5;

  // Try parsing candidate expressions: prefer input if it is an equation, then solved, then fallback
  const { primaryPath, secondaryPath, isCustom, effectiveLatex, yBounds } = useMemo(() => {
    // 1. Try input expression first (especially good for equations like x^2 + 44 = 0)
    let parsed = inputExpression ? latexToJsFunc(inputExpression) : null;

    // 2. If input didn't yield a plottable curve, try solvedLatex (e.g. simplified polynomial or derivative)
    if (!parsed && solvedLatex) {
      parsed = latexToJsFunc(solvedLatex);
    }

    if (parsed) {
      const { fn, cleanLatex } = parsed;

      // Sample fn across [-4, 4] to calculate dynamic yMin and yMax
      const sampleY: number[] = [];
      for (let i = -4; i <= 4; i += 0.5) {
        const val = fn(i);
        if (!isNaN(val) && isFinite(val)) {
          sampleY.push(val);
        }
      }

      let yMin = -5;
      let yMax = 5;

      if (sampleY.length > 0) {
        const minVal = Math.min(...sampleY);
        const maxVal = Math.max(...sampleY);
        const span = Math.max(2, maxVal - minVal);
        const pad = span * 0.15;

        // If function values are well outside [-5, 5], dynamically frame them
        if (minVal < -5 || maxVal > 5) {
          yMin = Math.floor(minVal - pad);
          yMax = Math.ceil(maxVal + pad);
        }
      }

      const primary = buildPath(fn, xMin, xMax, yMin, yMax, width, height);
      // Derivative approximation for secondary curve
      const h = 0.001;
      const derivFn = (x: number) => (fn(x + h) - fn(x - h)) / (2 * h);
      const secondary = buildPath(derivFn, xMin, xMax, yMin, yMax, width, height, 200);

      return {
        primaryPath: primary,
        secondaryPath: secondary,
        isCustom: true,
        effectiveLatex: cleanLatex,
        yBounds: { yMin, yMax },
      };
    }

    // Fallback: default rational function
    const defaultFn = (x: number) => (3 * x * x + 5 * x) / (x * x + 1);
    const defaultPrimary = buildPath(defaultFn, xMin, xMax, -5, 5, width, height);
    const defaultFn2 = (x: number) => 3 - 3 / (x * x + 1);
    const defaultSecondary = buildPath(defaultFn2, xMin, xMax, -5, 5, width, height);

    return {
      primaryPath: defaultPrimary,
      secondaryPath: defaultSecondary,
      isCustom: false,
      effectiveLatex: '\\frac{3x^2 + 5x}{x^2 + 1}',
      yBounds: { yMin: -5, yMax: 5 },
    };
  }, [solvedLatex, inputExpression]);

  const { yMin, yMax } = yBounds;
  const toSvgX = (x: number) => ((x - xMin) / (xMax - xMin)) * width;
  const toSvgY = (y: number) => height - ((y - yMin) / (yMax - yMin)) * height;

  // Generate 5-7 evenly distributed ticks for Y axis
  const yTicks = useMemo(() => {
    const count = 5;
    const step = (yMax - yMin) / count;
    const ticks: number[] = [];
    for (let i = 0; i <= count; i++) {
      ticks.push(Math.round(yMin + i * step));
    }
    return Array.from(new Set(ticks));
  }, [yMin, yMax]);

  const xTicks = [-4, -2, 0, 2, 4];

  // Clamp origin for axes so they stay visible if 0 is out of bounds
  const clampedOriginY = Math.max(15, Math.min(height - 15, toSvgY(0)));
  const isZeroInYRange = yMin <= 0 && 0 <= yMax;

  // Header display formula
  const displayFormula = formulaLabel || (effectiveLatex ? `f(x) = ${effectiveLatex}` : 'f(x)');

  return (
    <div className="w-full h-full bg-[#0d1424]/90 border border-slate-800/90 rounded-2xl p-4 flex flex-col gap-3 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-300">
            Interactive Graph
          </span>
        </div>
        {isCustom && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/40 border border-emerald-700/40 text-emerald-300 font-medium">
            Dynamic
          </span>
        )}
      </div>

      {/* Formula label rendered with MathRenderer */}
      <div className="text-center text-xs text-indigo-300 tracking-wide overflow-x-auto py-0.5 min-h-[26px]">
        <MathRenderer content={`$$${displayFormula}$$`} displayMode={false} />
      </div>

      {/* SVG canvas */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none">
          <defs>
            <filter id="neon-glow-gv" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="curve-grad-primary" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="50%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
            <linearGradient id="curve-grad-secondary" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.7" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {xTicks.map((t) => (
            <line
              key={`grid-x-${t}`}
              x1={toSvgX(t)}
              y1={0}
              x2={toSvgX(t)}
              y2={height}
              stroke="#1e293b"
              strokeWidth="0.8"
              strokeDasharray="2,3"
            />
          ))}
          {yTicks.map((t) => (
            <line
              key={`grid-y-${t}`}
              x1={0}
              y1={toSvgY(t)}
              x2={width}
              y2={toSvgY(t)}
              stroke="#1e293b"
              strokeWidth="0.8"
              strokeDasharray="2,3"
            />
          ))}

          {/* X Axis */}
          <line
            x1={0}
            y1={clampedOriginY}
            x2={width}
            y2={clampedOriginY}
            stroke="#475569"
            strokeWidth="1.2"
          />
          <polygon
            points={`${width},${clampedOriginY} ${width - 6},${clampedOriginY - 3} ${width - 6},${clampedOriginY + 3}`}
            fill="#64748b"
          />
          <text x={width - 10} y={clampedOriginY + 14} fill="#94a3b8" fontSize="10" fontFamily="monospace">
            x
          </text>

          {/* Y Axis */}
          <line x1={toSvgX(0)} y1={height} x2={toSvgX(0)} y2={0} stroke="#475569" strokeWidth="1.2" />
          <polygon points={`${toSvgX(0)},0 ${toSvgX(0) - 3},6 ${toSvgX(0) + 3},6`} fill="#64748b" />
          <text x={toSvgX(0) - 14} y={12} fill="#94a3b8" fontSize="10" fontFamily="monospace">
            y
          </text>

          {/* Tick labels */}
          {xTicks.map((t) => (
            <text
              key={`label-x-${t}`}
              x={toSvgX(t)}
              y={clampedOriginY + 12}
              fill="#64748b"
              fontSize="8.5"
              textAnchor="middle"
              fontFamily="monospace"
            >
              {t}
            </text>
          ))}
          {yTicks.map((t) => (
            <text
              key={`label-y-${t}`}
              x={toSvgX(0) - 6}
              y={toSvgY(t) + 3}
              fill="#64748b"
              fontSize="8.5"
              textAnchor="end"
              fontFamily="monospace"
            >
              {t}
            </text>
          ))}

          {/* Secondary curve (derivative / comparison) */}
          {secondaryPath && (
            <path
              d={secondaryPath}
              fill="none"
              stroke="url(#curve-grad-secondary)"
              strokeWidth="1.5"
              strokeDasharray="4,2"
              opacity="0.7"
            />
          )}

          {/* Primary curve */}
          <path
            d={primaryPath}
            fill="none"
            stroke="url(#curve-grad-primary)"
            strokeWidth="2.5"
            filter="url(#neon-glow-gv)"
          />

          {/* Origin dot */}
          {isZeroInYRange && <circle cx={toSvgX(0)} cy={toSvgY(0)} r="3" fill="#a855f7" />}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-0.5 bg-gradient-to-r from-indigo-400 to-violet-400 rounded" />
          <span>f(x)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-0.5 border-t border-dashed border-violet-500/50" />
          <span>{"f'(x)"}</span>
        </div>
      </div>
    </div>
  );
};

export default GraphViewer;
