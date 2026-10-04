'use client';

import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  displayMode?: boolean;
  className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  displayMode = false,
  className = '',
}) => {
  const renderedHtml = useMemo(() => {
    if (!content) return '';

    // If whole content is wrapped in $$ or represents pure LaTeX formula without words
    const trimmed = content.trim();
    const hasMathDelimiters = trimmed.includes('$$') || trimmed.includes('$');

    if (!hasMathDelimiters) {
      // Direct render of the math expression
      try {
        return katex.renderToString(trimmed, {
          displayMode: displayMode,
          throwOnError: false,
          output: 'htmlAndMathml',
        });
      } catch (err) {
        console.warn('KaTeX direct render error:', err);
        return `<span class="text-rose-400 font-mono text-sm">${escapeHtml(trimmed)}</span>`;
      }
    }

    // Handle mixed prose + math: e.g. "Initial Expression: $$x^2 - 4$$"
    // Regex splits by $$...$$ or $...$
    const parts = trimmed.split(/(\$\$[\s\S]*?\$\$|\$[^\$]*?\$)/g);

    return parts
      .map((part) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const math = part.slice(2, -2).trim();
          try {
            return katex.renderToString(math, {
              displayMode: true,
              throwOnError: false,
              output: 'htmlAndMathml',
            });
          } catch {
            return `<code class="text-rose-400 font-mono text-sm">${escapeHtml(math)}</code>`;
          }
        } else if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1).trim();
          try {
            return katex.renderToString(math, {
              displayMode: false,
              throwOnError: false,
              output: 'htmlAndMathml',
            });
          } catch {
            return `<code class="text-rose-400 font-mono text-sm">${escapeHtml(math)}</code>`;
          }
        }
        // Text prose
        return `<span class="text-slate-300">${escapeHtml(part)}</span>`;
      })
      .join('');
  }, [content, displayMode]);

  return (
    <div
      className={`katex-render-container overflow-x-auto py-1 ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default MathRenderer;
