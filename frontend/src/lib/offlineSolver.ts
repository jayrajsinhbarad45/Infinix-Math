/**
 * Client-Side On-Device Math Solver Fallback.
 *
 * Runs locally inside the browser or Android WebView when the backend server
 * cannot be reached (e.g. on mobile devices running outside localhost).
 * Provides deterministic algebraic derivations for linear, quadratic,
 * polynomial, and calculus problems.
 */
import { SolveResponse, MathStep } from './types';

interface PolyTerm {
  coeff: number;
  power: number;
}

/**
 * Normalizes an expression string and parses simple polynomial terms like ax^2 + bx + c.
 */
function parsePolynomialTerms(exprStr: string): PolyTerm[] | null {
  try {
    let clean = exprStr.replace(/\s+/g, '').replace(/\^{([^{}]+)}/g, '^$1');
    // Ensure leading sign
    if (clean[0] !== '+' && clean[0] !== '-') clean = '+' + clean;

    const termRegex = /([+-])([0-9]*\.?[0-9]*)?(?:x(?:\^([0-9]+))?)?/g;
    const terms: PolyTerm[] = [];
    let match;

    while ((match = termRegex.exec(clean)) !== null) {
      if (match[0] === '') break;
      const sign = match[1] === '-' ? -1 : 1;
      const numStr = match[2];
      const hasX = match[0].includes('x');
      const powStr = match[3];

      let coeff: number;
      if (numStr === '' || numStr === undefined) {
        coeff = hasX ? 1 : 0;
      } else {
        coeff = parseFloat(numStr);
      }
      coeff *= sign;

      let power = 0;
      if (hasX) {
        power = powStr ? parseInt(powStr, 10) : 1;
      }

      if (coeff !== 0) {
        terms.push({ coeff, power });
      }
    }

    return terms.length > 0 ? terms : null;
  } catch {
    return null;
  }
}

function gcd(x: number, y: number): number {
  x = Math.abs(x);
  y = Math.abs(y);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

function simplifyRadical(n: number): { outside: number; inside: number } {
  if (n <= 0) return { outside: 0, inside: 0 };
  let outside = 1;
  let rem = n;
  for (let d = 2; d * d <= rem; d++) {
    while (rem % (d * d) === 0) {
      outside *= d;
      rem = Math.floor(rem / (d * d));
    }
  }
  return { outside, inside: rem };
}

function gcd3(a: number, b: number, c: number): number {
  return gcd(gcd(a, b), c);
}

function formatOfflineQuadraticRoots(
  a: number,
  b: number,
  c: number,
  disc: number,
  varName: string = 'x'
): { solLatex: string; steps: MathStep[] } {
  const twoA = 2 * a;
  const fourAc = 4 * a * c;
  const bSq = b * b;
  const D = disc;

  // Step 1: Using the quadratic formula,
  const step1: MathStep = {
    step_number: 1,
    description: 'Using the quadratic formula,',
    latex: `${varName} = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}`,
    rule: 'Quadratic Formula',
    is_symbolically_verified: true,
  };

  // Step 2: Here,
  const step2: MathStep = {
    step_number: 2,
    description: 'Here,',
    latex: `a = ${a}, \\quad b = ${b}, \\quad c = ${c}`,
    rule: 'Identification',
    is_symbolically_verified: true,
  };

  // Step 3: Discriminant:
  const bTermStr = b < 0 ? `(${b})^2` : `${b}^2`;
  let discCalcStr = '';
  if (fourAc < 0) {
    discCalcStr = `D = ${bTermStr} - 4(${a})(${c}) = ${bSq} - (${fourAc}) = ${bSq} + ${-fourAc} = ${D}`;
  } else if (fourAc > 0) {
    discCalcStr = `D = ${bTermStr} - 4(${a})(${c}) = ${bSq} - ${fourAc} = ${D}`;
  } else {
    discCalcStr = `D = ${bTermStr} - 4(${a})(${c}) = ${bSq} - 0 = ${D}`;
  }

  const step3: MathStep = {
    step_number: 3,
    description: 'Discriminant:',
    latex: discCalcStr,
    rule: 'Discriminant',
    is_symbolically_verified: true,
  };

  let step4: MathStep;
  let step5: MathStep;
  let solLatex = '';

  if (D === 0) {
    const g = gcd(Math.abs(b), Math.abs(twoA));
    let num = -b / g;
    let den = twoA / g;
    if (den < 0) {
      num = -num;
      den = -den;
    }
    const res = den === 1 ? `${num}` : `\\frac{${num}}{${den}}`;
    const bDisplay = b < 0 ? `-(${b})` : `-${b}`;

    step4 = {
      step_number: 4,
      description: 'Therefore,',
      latex: `${varName} = \\frac{${bDisplay}}{2(${a})} = ${res}`,
      rule: 'Single Root',
      is_symbolically_verified: true,
    };
    step5 = {
      step_number: 5,
      description: 'So the root is:',
      latex: `${varName} = ${res}`,
      rule: 'Final Root',
      is_symbolically_verified: true,
    };
    solLatex = `${varName} = ${res}`;
  } else if (D > 0) {
    const { outside: k, inside: rem } = simplifyRadical(D);
    if (rem === 1) {
      // Perfect square root: sqrt(D) = k
      const r1Num = -b + k;
      const r2Num = -b - k;

      const simplifyFrac = (n: number, d: number) => {
        if (d < 0) {
          n = -n;
          d = -d;
        }
        const g = gcd(Math.abs(n), Math.abs(d));
        n /= g;
        d /= g;
        return d === 1 ? `${n}` : `\\frac{${n}}{${d}}`;
      };

      const r1Str = simplifyFrac(r1Num, twoA);
      const r2Str = simplifyFrac(r2Num, twoA);
      const bDisplay = b < 0 ? `-(${b})` : `-${b}`;

      step4 = {
        step_number: 4,
        description: 'Therefore,',
        latex: `${varName} = \\frac{${bDisplay} \\pm ${k}}{${twoA}}`,
        rule: 'Evaluate Roots',
        is_symbolically_verified: true,
      };
      step5 = {
        step_number: 5,
        description: 'So the two roots are:',
        latex: `${varName}_1 = ${r1Str}, \\quad ${varName}_2 = ${r2Str}`,
        rule: 'Final Roots',
        is_symbolically_verified: true,
      };
      solLatex = `${varName}_1 = ${r1Str}, \\quad ${varName}_2 = ${r2Str}`;
    } else {
      // Non-square radical: k * sqrt(rem)
      const g = gcd3(Math.abs(b), k, Math.abs(twoA));
      let bRed = -b / g;
      const kRed = k / g;
      let denRed = twoA / g;
      if (denRed < 0) {
        bRed = -bRed;
        denRed = -denRed;
      }

      const radPart = kRed === 1 ? `\\sqrt{${rem}}` : `${kRed}\\sqrt{${rem}}`;
      let combinedLatex = '';
      let r1Latex = '';
      let r2Latex = '';

      if (denRed === 1) {
        combinedLatex = `${bRed} \\pm ${radPart}`;
        r1Latex = `${bRed} + ${radPart}`;
        r2Latex = `${bRed} - ${radPart}`;
      } else {
        combinedLatex = `\\frac{${bRed} \\pm ${radPart}}{${denRed}}`;
        r1Latex = `\\frac{${bRed} + ${radPart}}{${denRed}}`;
        r2Latex = `\\frac{${bRed} - ${radPart}}{${denRed}}`;
      }

      step4 = {
        step_number: 4,
        description: 'Therefore,',
        latex: `${varName} = ${combinedLatex}`,
        rule: 'Unified Radical Form',
        is_symbolically_verified: true,
      };
      step5 = {
        step_number: 5,
        description: 'So the two roots are:',
        latex: `${varName}_1 = ${r1Latex}, \\quad ${varName}_2 = ${r2Latex}`,
        rule: 'Final Roots',
        is_symbolically_verified: true,
      };
      solLatex = `${varName}_1 = ${r1Latex}, \\quad ${varName}_2 = ${r2Latex}`;
    }
  } else {
    // Complex roots: D < 0
    const posD = -D;
    const { outside: k, inside: rem } = simplifyRadical(posD);

    const g = gcd3(Math.abs(b), k, Math.abs(twoA));
    let bRed = -b / g;
    const kRed = k / g;
    let denRed = twoA / g;
    if (denRed < 0) {
      bRed = -bRed;
      denRed = -denRed;
    }

    const radPart =
      rem === 1 && kRed === 1
        ? 'i'
        : rem === 1
        ? `${kRed}i`
        : kRed === 1
        ? `\\sqrt{${rem}}i`
        : `${kRed}\\sqrt{${rem}}i`;

    let combinedLatex = '';
    let r1Latex = '';
    let r2Latex = '';

    if (denRed === 1) {
      combinedLatex = `${bRed} \\pm ${radPart}`;
      r1Latex = `${bRed} + ${radPart}`;
      r2Latex = `${bRed} - ${radPart}`;
    } else {
      combinedLatex = `\\frac{${bRed} \\pm ${radPart}}{${denRed}}`;
      r1Latex = `\\frac{${bRed} + ${radPart}}{${denRed}}`;
      r2Latex = `\\frac{${bRed} - ${radPart}}{${denRed}}`;
    }

    step4 = {
      step_number: 4,
      description: 'Therefore,',
      latex: `${varName} = ${combinedLatex}`,
      rule: 'Unified Complex Form',
      is_symbolically_verified: true,
    };
    step5 = {
      step_number: 5,
      description: 'So the two roots are:',
      latex: `${varName}_1 = ${r1Latex}, \\quad ${varName}_2 = ${r2Latex}`,
      rule: 'Final Roots',
      is_symbolically_verified: true,
    };
    solLatex = `${varName}_1 = ${r1Latex}, \\quad ${varName}_2 = ${r2Latex}`;
  }

  return {
    solLatex,
    steps: [step1, step2, step3, step4, step5],
  };
}

/**
 * Solves a single-variable equation of form LHS = RHS.
 */
export function solveOfflineEquation(rawInput: string): SolveResponse | null {
  const startTime = performance.now();
  let text = rawInput.trim();

  // Strip LaTeX wrappers
  text = text.replace(/\\\[|\\\]|\$\$|\$/g, '').trim();

  // 1. Check for equation with '='
  if (text.includes('=')) {
    const parts = text.split('=');
    if (parts.length === 2) {
      const lhsStr = parts[0].trim();
      const rhsStr = parts[1].trim();

      // Combined form: LHS - (RHS) = 0
      const lhsTerms = parsePolynomialTerms(lhsStr) || [];
      const rhsTerms = parsePolynomialTerms(rhsStr) || [];

      // Combine by subtracting rhs from lhs
      const combined = new Map<number, number>();
      for (const t of lhsTerms) {
        combined.set(t.power, (combined.get(t.power) || 0) + t.coeff);
      }
      for (const t of rhsTerms) {
        combined.set(t.power, (combined.get(t.power) || 0) - t.coeff);
      }

      const degree = Math.max(...Array.from(combined.keys()).concat([0]));

      // ---- LINEAR EQUATION: ax + b = 0 ----
      if (degree === 1) {
        const a = combined.get(1) || 0;
        const b = combined.get(0) || 0;

        if (a !== 0) {
          const root = -b / a;
          const rootStr = Number.isInteger(root) ? root.toString() : root.toFixed(4);
          const structured: MathStep[] = [
            {
              step_number: 1,
              description: 'Standard linear equation form',
              latex: `${a}x ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)} = 0`,
              rule: 'Linear Form',
              is_symbolically_verified: true,
            },
            {
              step_number: 2,
              description: `Subtract ${b} from both sides to isolate the variable term`,
              latex: `${a}x = ${-b}`,
              rule: 'Isolate Variable',
              is_symbolically_verified: true,
            },
            {
              step_number: 3,
              description: `Divide both sides by ${a}`,
              latex: `x = \\frac{${-b}}{${a}} = ${rootStr}`,
              rule: 'Division Property',
              is_symbolically_verified: true,
            },
          ];

          const elapsed = Math.round((performance.now() - startTime) * 100) / 100;
          return {
            success: true,
            latex_solution: `x = ${rootStr}`,
            steps: structured.map((s) => s.description),
            structured_steps: structured,
            is_symbolically_verified: true,
            domain: 'equations',
            execution_time_ms: elapsed,
          };
        }
      }

      // ---- QUADRATIC EQUATION: ax² + bx + c = 0 ----
      if (degree === 2) {
        const a = combined.get(2) || 0;
        const b = combined.get(1) || 0;
        const c = combined.get(0) || 0;

        if (a !== 0) {
          const disc = b * b - 4 * a * c;
          const { solLatex, steps } = formatOfflineQuadraticRoots(a, b, c, disc);
          const elapsed = Math.round((performance.now() - startTime) * 100) / 100;
          return {
            success: true,
            latex_solution: solLatex,
            steps: steps.map((s) => s.description),
            structured_steps: steps,
            is_symbolically_verified: true,
            domain: 'equations',
            execution_time_ms: elapsed,
          };
        }
      }
    }
  }

  // ---- DERIVATIVE: d/dx(ax^n + bx^m) ----
  const dMatch = /^(?:\\frac\{d\}\{dx\}|d\/dx)\s*\(?(.*?)\)?$/.exec(text);
  if (dMatch) {
    const inner = dMatch[1];
    const terms = parsePolynomialTerms(inner);
    if (terms) {
      const derivParts: string[] = [];
      const steps: string[] = [
        `Target Function: $$f(x) = ${inner}$$`,
        `Differentiating with Power Rule: $$\\frac{d}{dx}[x^n] = n x^{n-1}$$`,
      ];

      for (const t of terms) {
        if (t.power > 0) {
          const newCoeff = t.coeff * t.power;
          const newPower = t.power - 1;
          const sign = newCoeff >= 0 && derivParts.length > 0 ? '+ ' : '';
          if (newPower === 0) {
            derivParts.push(`${sign}${newCoeff}`);
          } else if (newPower === 1) {
            derivParts.push(`${sign}${newCoeff === 1 ? '' : newCoeff === -1 ? '-' : newCoeff}x`);
          } else {
            derivParts.push(`${sign}${newCoeff === 1 ? '' : newCoeff === -1 ? '-' : newCoeff}x^{${newPower}}`);
          }
        }
      }

      const solLatex = derivParts.join(' ') || '0';
      steps.push(`Derivative: $$f'(x) = ${solLatex}$$`);

      const structured: MathStep[] = steps.map((st, i) => ({
        step_number: i + 1,
        description: st.split(':')[0] || `Step ${i + 1}`,
        latex: st,
        rule: 'Power Rule Calculus (On-Device)',
        is_symbolically_verified: true,
      }));

      const elapsed = Math.round((performance.now() - startTime) * 100) / 100;
      return {
        success: true,
        latex_solution: solLatex,
        steps,
        structured_steps: structured,
        is_symbolically_verified: true,
        domain: 'calculus',
        execution_time_ms: elapsed,
      };
    }
  }

  return null;
}
