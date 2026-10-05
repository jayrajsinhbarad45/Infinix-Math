'use client';

import React, { useMemo } from 'react';

interface GraphViewerProps {
  formulaLabel?: string;
  expression?: string;
}

export const GraphViewer: React.FC<GraphViewerProps> = ({
  formulaLabel = 'f(x) = \\frac{3x^2 + 5x}{x^2 + 1}',
}) => {
  // SVG dimensions and coordinate bounds [-4, 4]
  const width = 380;
  const height = 340;
  const xMin = -4.5;
  const xMax = 4.5;
  const yMin = -4.5;
  const yMax = 4.5;

  const toSvgX = (x: number) => ((x - xMin) / (xMax - xMin)) * width;
  const toSvgY = (y: number) => height - ((y - yMin) / (yMax - yMin)) * height;

  // Generate curve points for f(x) = (3x^2 + 5x) / (x^2 + 1)
  const curvePath1 = useMemo(() => {
    const points: string[] = [];
    const step = 0.08;
    for (let x = xMin; x <= xMax; x += step) {
      const y = (3 * x * x + 5 * x) / (x * x + 1);
      if (!isNaN(y) && isFinite(y)) {
        const sx = toSvgX(x);
        const sy = toSvgY(y);
        points.push(`${points.length === 0 ? 'M' : 'L'} ${sx.toFixed(1)} ${sy.toFixed(1)}`);
      }
    }
    return points.join(' ');
  }, []);

  // Generate secondary comparison / asymptote curve for aesthetic depth
  const curvePath2 = useMemo(() => {
    const points: string[] = [];
    const step = 0.08;
    for (let x = xMin; x <= xMax; x += step) {
      // f(x) - derivative or parallel harmonic
      const y = 3 - 3 / (x * x + 1);
      if (!isNaN(y) && isFinite(y)) {
        const sx = toSvgX(x);
        const sy = toSvgY(y);
        points.push(`${points.length === 0 ? 'M' : 'L'} ${sx.toFixed(1)} ${sy.toFixed(1)}`);
      }
    }
    return points.join(' ');
  }, []);

  // Grid tick values
  const ticks = [-4, -3, -2, -1, 1, 2, 3, 4];

  return (
    <div className="w-full h-full bg-[#0d1424]/90 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
      {/* Header formula label */}
      <div className="text-center font-mono text-xs text-indigo-300 tracking-wide pb-1">
        <span>{formulaLabel}</span>
      </div>

      {/* Coordinate Canvas */}
      <div className="relative w-full aspect-square flex items-center justify-center overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full select-none"
        >
          <defs>
            {/* Glow filter for neon curves */}
            <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Gradient for main curve */}
            <linearGradient id="curve-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="50%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>

            <linearGradient id="secondary-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {ticks.map((t) => (
            <g key={`grid-${t}`}>
              <line
                x1={toSvgX(t)}
                y1={0}
                x2={toSvgX(t)}
                y2={height}
                stroke="#1e293b"
                strokeWidth="0.8"
                strokeDasharray="2,3"
              />
              <line
                x1={0}
                y1={toSvgY(t)}
                x2={width}
                y2={toSvgY(t)}
                stroke="#1e293b"
                strokeWidth="0.8"
                strokeDasharray="2,3"
              />
            </g>
          ))}

          {/* X Axis */}
          <line
            x1={0}
            y1={toSvgY(0)}
            x2={width}
            y2={toSvgY(0)}
            stroke="#475569"
            strokeWidth="1.2"
          />
          {/* X Arrow */}
          <polygon
            points={`${width},${toSvgY(0)} ${width - 6},${toSvgY(0) - 3} ${width - 6},${toSvgY(0) + 3}`}
            fill="#64748b"
          />
          <text
            x={width - 10}
            y={toSvgY(0) + 14}
            fill="#94a3b8"
            fontSize="10"
            fontFamily="monospace"
          >
            x
          </text>

          {/* Y Axis */}
          <line
            x1={toSvgX(0)}
            y1={height}
            x2={toSvgX(0)}
            y2={0}
            stroke="#475569"
            strokeWidth="1.2"
          />
          {/* Y Arrow */}
          <polygon
            points={`${toSvgX(0)},0 ${toSvgX(0) - 3},6 ${toSvgX(0) + 3},6`}
            fill="#64748b"
          />
          <text
            x={toSvgX(0) - 14}
            y={12}
            fill="#94a3b8"
            fontSize="10"
            fontFamily="monospace"
          >
            y
          </text>

          {/* X Axis Tick Labels */}
          {ticks.map((t) => (
            <text
              key={`x-label-${t}`}
              x={toSvgX(t)}
              y={toSvgY(0) + 12}
              fill="#64748b"
              fontSize="8.5"
              textAnchor="middle"
              fontFamily="monospace"
            >
              {t}
            </text>
          ))}

          {/* Y Axis Tick Labels */}
          {ticks.map((t) => (
            <text
              key={`y-label-${t}`}
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

          {/* Secondary Function Curve */}
          <path
            d={curvePath2}
            fill="none"
            stroke="url(#secondary-gradient)"
            strokeWidth="1.5"
            strokeDasharray="4,2"
          />

          {/* Main Primary Glowing Curve */}
          <path
            d={curvePath1}
            fill="none"
            stroke="url(#curve-gradient)"
            strokeWidth="2.5"
            filter="url(#neon-glow)"
          />

          {/* Key point: Origin (0,0) */}
          <circle cx={toSvgX(0)} cy={toSvgY(0)} r="3" fill="#a855f7" />
        </svg>
      </div>
    </div>
  );
};

export default GraphViewer;
