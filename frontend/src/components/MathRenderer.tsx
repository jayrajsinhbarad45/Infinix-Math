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

    let cleaned = content.trim();
    // If the entire string is wrapped in matching $$...$$ with no other $$, unwrap for direct displayMode rendering
    if (cleaned.startsWith('$$') && cleaned.endsWith('$$') && (cleaned.match(/\$\$/g) || []).length === 2) {
      cleaned = cleaned.slice(2, -2).trim();
    } else if (cleaned.startsWith('$') && cleaned.endsWith('$') && (cleaned.match(/\$/g) || []).length === 2) {
      cleaned = cleaned.slice(1, -1).trim();
    }

    const hasMathDelimiters = cleaned.includes('$$') || cleaned.includes('$');

    if (!hasMathDelimiters) {
      if (isPureProse(cleaned)) {
        return `<span class="text-slate-200">${escapeHtml(cleaned)}</span>`;
      }
      // Direct render of the math expression
      try {
        return katex.renderToString(cleaned, {
          displayMode: displayMode,
          throwOnError: false,
          output: 'htmlAndMathml',
        });
      } catch (err) {
        console.warn('KaTeX direct render error:', err);
        return `<span class="text-rose-400 font-mono text-sm">${escapeHtml(cleaned)}</span>`;
      }
    }

    // Handle mixed prose + math: e.g. "Step 1: Compare with $ax^2 + bx + c = 0$"
    const parts = cleaned.split(/(\$\$[\s\S]*?\$\$|\$[^\$]*?\$)/g);

    return parts
      .map((part) => {
        if (!part) return '';
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

function isPureProse(text: string): boolean {
  const t = text.trim();
  // If it contains backslash commands or math delimiters, it's not pure prose
  if (/\\\w+|\$\$|\$/.test(t)) return false;
  // If it's a single English word or multiple English words with spaces/punctuation
  // e.g. 'Using the quadratic formula,', 'Discriminant:', 'Here,', 'So the two roots are:'
  if (/^[a-zA-Z\s,.:;!?'\(\)\-]+$/.test(t)) {
    const words = t.split(/\s+/);
    if (words.length >= 2 || (words.length === 1 && words[0].replace(/[^a-zA-Z]/g, '').length >= 3)) {
      return true;
    }
  }
  return false;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default MathRenderer;
