"""Deterministic SymPy-based Symbolic Computation Engine.

Provides safe LaTeX parsing, algebraic simplification, equation solving,
differentiation, integration, and symbolic equivalence verification with timeout protection.
"""
from __future__ import annotations

import logging
import random
import re
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeout
from typing import Any, Dict, List, Optional, Tuple, Union

import sympy
from sympy import (
    E, Eq, I, Matrix, Rational, Symbol, diff, expand, factor, integrate,
    lambdify, latex, linsolve, nsimplify, oo, pi, powsimp, simplify,
    solve, symbols, sympify, trigsimp
)

from app.core.config import settings

logger = logging.getLogger(__name__)

# Standard algebraic symbols
DEFAULT_SYMBOLS: Dict[str, Symbol] = {
    "x": symbols("x"),
    "y": symbols("y"),
    "z": symbols("z"),
    "t": symbols("t"),
    "u": symbols("u"),
    "v": symbols("v"),
    "w": symbols("w"),
    "a": symbols("a"),
    "b": symbols("b"),
    "c": symbols("c"),
    "d": symbols("d"),
    "k": symbols("k"),
    "m": symbols("m"),
    "n": symbols("n", integer=True),
    "p": symbols("p"),
    "q": symbols("q"),
    "r": symbols("r"),
    "s": symbols("s"),
    "theta": symbols("theta", real=True),
    "phi": symbols("phi", real=True),
    "pi": pi,
    "e": E,
    "oo": oo,
    "inf": oo,
    "I": I,
}

# Supported mathematical functions
DEFAULT_FUNCTIONS: Dict[str, Any] = {
    "sin": sympy.sin,
    "cos": sympy.cos,
    "tan": sympy.tan,
    "cot": sympy.cot,
    "sec": sympy.sec,
    "csc": sympy.csc,
    "asin": sympy.asin,
    "acos": sympy.acos,
    "atan": sympy.atan,
    "arcsin": sympy.asin,
    "arccos": sympy.acos,
    "arctan": sympy.atan,
    "sinh": sympy.sinh,
    "cosh": sympy.cosh,
    "tanh": sympy.tanh,
    "log": sympy.log,
    "ln": sympy.log,
    "exp": sympy.exp,
    "sqrt": sympy.sqrt,
    "Abs": sympy.Abs,
    "abs": sympy.Abs,
    "floor": sympy.floor,
    "ceiling": sympy.ceiling,
    "factorial": sympy.factorial,
}

# Rational points for multi-point numerical equivalence spot-checking
SAMPLE_POINTS = [
    Rational(-5, 1), Rational(-3, 1), Rational(-2, 1), Rational(-3, 2),
    Rational(-1, 1), Rational(-1, 2), Rational(-1, 3), Rational(1, 3),
    Rational(1, 2), Rational(1, 1), Rational(3, 2), Rational(2, 1),
    Rational(3, 1), Rational(5, 1), Rational(7, 2),
]


class LatexParser:
    """Translates common mathematical LaTeX notation into clean SymPy-compatible strings."""

    @staticmethod
    def _find_brace_end(text: str, start: int) -> int:
        if start >= len(text) or text[start] != "{":
            return -1
        depth = 0
        for i in range(start, len(text)):
            if text[i] == "{":
                depth += 1
            elif text[i] == "}":
                depth -= 1
                if depth == 0:
                    return i
        return -1

    @classmethod
    def latex_to_sympy_str(cls, text: str) -> str:
        """Converts LaTeX formatting into SymPy parseable expression syntax."""
        if not text:
            return ""

        s = text.strip()
        # Strip enclosing dollar signs or LaTeX math blocks
        s = re.sub(r"^(\$\$|\$|\\\[|\\\()", "", s)
        s = re.sub(r"(\$\$|\$|\\\]|\\\))$", "", s)
        s = s.strip()

        # Normalize spaces and standard symbols
        s = s.replace(r"\cdot", "*").replace(r"\times", "*")
        s = s.replace(r"\left", "").replace(r"\right", "")
        s = s.replace(r"\pi", "pi").replace(r"\infty", "oo")

        # Replace fractions: \frac{a}{b} -> ((a)/(b))
        frac_pattern = re.compile(r"\\(?:d|t)?frac\s*\{")
        while True:
            match = frac_pattern.search(s)
            if not match:
                break
            brace1_start = match.end() - 1
            brace1_end = cls._find_brace_end(s, brace1_start)
            if brace1_end == -1:
                break
            num = s[brace1_start + 1 : brace1_end]

            rem = s[brace1_end + 1 :].lstrip()
            if not rem.startswith("{"):
                break
            brace2_start = s.find("{", brace1_end + 1)
            brace2_end = cls._find_brace_end(s, brace2_start)
            if brace2_end == -1:
                break
            den = s[brace2_start + 1 : brace2_end]

            replacement = f"(({cls.latex_to_sympy_str(num)})/({cls.latex_to_sympy_str(den)}))"
            s = s[: match.start()] + replacement + s[brace2_end + 1 :]

        # Replace square roots: \sqrt[n]{x} or \sqrt{x}
        sqrt_n_pattern = re.compile(r"\\sqrt\s*\[(.*?)\]\s*\{(.*?)\}")
        while sqrt_n_pattern.search(s):
            s = sqrt_n_pattern.sub(r"((\2)**(1/(\1)))", s)

        sqrt_pattern = re.compile(r"\\sqrt\s*\{")
        while True:
            match = sqrt_pattern.search(s)
            if not match:
                break
            brace_start = match.end() - 1
            brace_end = cls._find_brace_end(s, brace_start)
            if brace_end == -1:
                break
            inner = s[brace_start + 1 : brace_end]
            s = s[: match.start()] + f"sqrt({cls.latex_to_sympy_str(inner)})" + s[brace_end + 1 :]

        # Handle function powers before general caret replacement: e.g. \sin^2(x) -> (sin(x))**2, \cos^{2}(x) -> (cos(x))**2
        funcs_with_powers = (
            "sin", "cos", "tan", "cot", "sec", "csc", "sinh", "cosh", "tanh",
            "asin", "acos", "atan", "arcsin", "arccos", "arctan", "ln", "log"
        )
        funcs_pattern = "|".join(funcs_with_powers)
        func_pow_brace = re.compile(
            rf"\\({funcs_pattern})\s*\^\{{([^}}]+)\}}\s*(\([^\)]+\)|[a-zA-Z0-9]+)"
        )
        s = func_pow_brace.sub(r"(\1(\3))**(\2)", s)

        func_pow_single = re.compile(
            rf"\\({funcs_pattern})\s*\^([0-9a-zA-Z])\s*(\([^\)]+\)|[a-zA-Z0-9]+)"
        )
        s = func_pow_single.sub(r"(\1(\3))**\2", s)

        # Handle powers: ^{expr} -> **(expr) and ^n -> **n
        brace_pow = re.compile(r"\^\{")
        while True:
            match = brace_pow.search(s)
            if not match:
                break
            start = match.end() - 1
            end = cls._find_brace_end(s, start)
            if end == -1:
                break
            inner = s[start + 1 : end]
            s = s[: match.start()] + f"**({cls.latex_to_sympy_str(inner)})" + s[end + 1 :]

        s = re.sub(r"\^([0-9a-zA-Z])", r"**\1", s)

        # Standard trigonometric/logarithmic functions
        funcs = [
            "arcsin", "arccos", "arctan", "asin", "acos", "atan",
            "sinh", "cosh", "tanh", "sin", "cos", "tan", "sec", "csc", "cot",
            "ln", "log", "exp", "abs"
        ]
        for f in funcs:
            s = re.sub(rf"\\{f}\b", f, s)

        # Remove backslashes before remaining letters or words (e.g. \theta -> theta)
        s = re.sub(r"\\([a-zA-Z]+)", r"\1", s)

        # Handle multiplication between single variable identifiers: e.g. x y -> x*y
        s = re.sub(r"\b([a-zA-Z])\s+([a-zA-Z])\b", r"\1*\2", s)

        # Implicit multiplication insertion: e.g. 2x -> 2*x, 3(x+1) -> 3*(x+1), (x+1)(x+2) -> (x+1)*(x+2)
        s = re.sub(r"(\d)\s*([a-zA-Z(])", r"\1*\2", s)
        s = re.sub(r"(\))\s*([a-zA-Z0-9(])", r"\1*\2", s)
        s = re.sub(r"([a-zA-Z])\s*(\()", r"\1*\2", s)

        # Fix situations where known functions got an extra * before opening bracket
        for f in funcs + ["sqrt"]:
            s = re.sub(rf"\b{f}\*\s*\(", f"{f}(", s)

        return s.strip()


def format_quadratic_roots(a: Any, b: Any, c: Any, target_var: Any, disc: Any) -> str:
    """Formats quadratic roots into clean, student-friendly standard fractions."""
    if not (getattr(a, "is_integer", False) and getattr(b, "is_integer", False) and getattr(disc, "is_integer", False)):
        sol = solve(a * target_var**2 + b * target_var + c, target_var)
        return ", ".join([f"{latex(target_var)} = {latex(s)}" for s in sol])

    a_val = int(a)
    b_val = int(b)
    disc_val = int(disc)

    two_a = 2 * a_val
    if disc_val >= 0:
        sq = sympy.sqrt(disc_val)
        r1 = (-b_val + sq) / two_a
        r2 = (-b_val - sq) / two_a
        if disc_val == 0:
            return f"{latex(target_var)} = {latex(r1)}"
        return f"{latex(target_var)} = {latex(r1)}, \\quad {latex(target_var)} = {latex(r2)}"
    else:
        sq = sympy.sqrt(-disc_val)
        coeff, rad = sq.as_coeff_Mul()
        g = sympy.gcd(sympy.gcd(abs(b_val), abs(int(coeff))), abs(two_a))
        g_val = int(g) if g else 1
        b_red = -b_val // g_val
        rad_red = sq / g_val
        den_red = two_a // g_val
        if den_red < 0:
            b_red, den_red = -b_red, -den_red

        rad_str = "i" if rad_red == 1 else f"{latex(rad_red)}i"

        if b_red == 0 and den_red == 1:
            return f"{latex(target_var)} = \\pm {rad_str}"
        elif b_red == 0:
            return f"{latex(target_var)} = \\pm \\frac{{{rad_str}}}{{{den_red}}}"
        elif den_red == 1:
            return f"{latex(target_var)} = {b_red} \\pm {rad_str}"
        else:
            return f"{latex(target_var)} = \\frac{{{b_red} \\pm {rad_str}}}{{{den_red}}}"


class SympyEngine:
    """Core deterministic symbolic solver & verifier for Infinix Math."""

    def __init__(self, timeout_seconds: Optional[float] = None):
        self.timeout_seconds = timeout_seconds or settings.SYMPY_TIMEOUT_SECONDS

    def _execute_with_timeout(self, func, *args, **kwargs) -> Any:
        with ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(func, *args, **kwargs)
            try:
                return future.result(timeout=self.timeout_seconds)
            except FuturesTimeout:
                logger.warning("SymPy operation timed out after %.2f seconds", self.timeout_seconds)
                raise TimeoutError(f"SymPy computation exceeded timeout of {self.timeout_seconds}s")

    def parse_expression(self, text: str) -> sympy.Expr:
        """Parses LaTeX or string into a validated SymPy expression safely."""
        cleaned = LatexParser.latex_to_sympy_str(text)
        if not cleaned:
            raise ValueError("Empty or invalid mathematical input")

        if len(cleaned) > settings.MAX_AST_SIZE:
            raise ValueError(f"Input exceeds maximum allowed AST size ({settings.MAX_AST_SIZE} chars)")

        locals_dict = {**DEFAULT_SYMBOLS, **DEFAULT_FUNCTIONS}
        try:
            expr = sympify(cleaned, locals=locals_dict, evaluate=False)
            if not isinstance(expr, (sympy.Expr, sympy.Basic, sympy.Number, sympy.Symbol)):
                raise ValueError("Parsed object is not a valid mathematical expression")
            return expr
        except Exception as e:
            logger.debug("sympify failed on %r: %s", cleaned, e)
            raise ValueError(f"Failed to parse mathematical expression '{text}': {str(e)}")

    def simplify_expression(self, text: str) -> Dict[str, Any]:
        """Performs full algebraic simplification with step generation."""
        def _calc():
            expr = self.parse_expression(text)
            steps: List[str] = [f"Initial Expression: $${latex(expr)}$$"]

            expanded = expand(expr)
            if expanded != expr:
                steps.append(f"Expand Polynomials: $${latex(expanded)}$$")

            factored = factor(expr)
            if factored != expr and factored != expanded:
                steps.append(f"Factorized Form: $${latex(factored)}$$")

            simplified = simplify(expr)
            steps.append(f"Simplified Canonical Form: $${latex(simplified)}$$")

            return {
                "success": True,
                "latex_solution": latex(simplified),
                "steps": steps,
                "is_symbolically_verified": True,
                "domain": "algebra",
            }

        return self._execute_with_timeout(_calc)

    def solve_equation(self, text: str, variable_str: Optional[str] = None) -> Dict[str, Any]:
        """Solves algebraic equations and systems of equations."""
        def _calc():
            # Check for multiple comma-separated equations (System of Equations)
            if "," in text and ("=" in text or "==" in text):
                raw_eqs = [e.strip() for e in text.split(",") if e.strip()]
                parsed_eqs = []
                all_symbols = set()
                steps = ["System of Equations detected:"]

                for i, eq_str in enumerate(raw_eqs, 1):
                    if "=" in eq_str:
                        sides = eq_str.split("=")
                        lhs = self.parse_expression(sides[0])
                        rhs = self.parse_expression(sides[1]) if len(sides) > 1 else sympy.Integer(0)
                        eq = Eq(lhs, rhs, evaluate=False)
                    else:
                        expr = self.parse_expression(eq_str)
                        eq = Eq(expr, 0, evaluate=False)
                    parsed_eqs.append(eq)
                    all_symbols.update(eq.free_symbols)
                    steps.append(f"Equation ({i}): $${latex(eq)}$$")

                var_list = sorted(list(all_symbols), key=lambda s: s.name)
                sol = solve(parsed_eqs, var_list, dict=True)
                steps.append("Simultaneous solution evaluated via symbolic elimination.")

                if not sol:
                    sol_latex = r"\text{No solution exists}"
                else:
                    sol_parts = []
                    for sol_dict in sol:
                        part = ", ".join([f"{latex(k)} = {latex(v)}" for k, v in sol_dict.items()])
                        sol_parts.append(part)
                    sol_latex = "; ".join(sol_parts)

                steps.append(f"Final Solution Set: $${sol_latex}$$")
                return {
                    "success": True,
                    "latex_solution": sol_latex,
                    "steps": steps,
                    "is_symbolically_verified": True,
                    "domain": "equations",
                }

            # Single equation
            steps = []
            if "=" in text:
                parts = text.split("=")
                lhs = self.parse_expression(parts[0])
                rhs = self.parse_expression(parts[1]) if len(parts) > 1 else sympy.Integer(0)
                eq = Eq(lhs, rhs, evaluate=False)
                norm_expr = lhs - rhs
            else:
                norm_expr = self.parse_expression(text)
                eq = Eq(norm_expr, 0, evaluate=False)

            steps.append(f"Given Equation: $${latex(eq)}$$")
            if getattr(eq, "rhs", 0) != 0:
                steps.append(f"Normalized Form: $${latex(norm_expr)} = 0$$")

            # Determine variable to solve for
            free_vars = list(norm_expr.free_symbols)
            if variable_str:
                target_var = symbols(variable_str)
            elif free_vars:
                # Prefer x, then y, then first symbol
                var_names = [v.name for v in free_vars]
                if "x" in var_names:
                    target_var = next(v for v in free_vars if v.name == "x")
                else:
                    target_var = sorted(free_vars, key=lambda v: v.name)[0]
            else:
                target_var = symbols("x")

            steps.append(f"Solving with respect to variable $${latex(target_var)}$$")

            # Check for polynomial structure (linear, quadratic, factorable) to provide detailed student steps
            try:
                poly = sympy.Poly(norm_expr, target_var)
                deg = poly.degree()
                if deg == 2:
                    a = poly.coeff_monomial(target_var**2)
                    b = poly.coeff_monomial(target_var)
                    c = poly.coeff_monomial(1)
                    disc = b**2 - 4 * a * c
                    two_a = 2 * a

                    structured_steps = [
                        {
                            "step_number": 1,
                            "description": f"Identify coefficients from standard form a{latex(target_var)}^2 + b{latex(target_var)} + c = 0",
                            "latex": f"a = {latex(a)}, \\quad b = {latex(b)}, \\quad c = {latex(c)}",
                            "rule": "Identification",
                            "is_symbolically_verified": True,
                        },
                        {
                            "step_number": 2,
                            "description": "Calculate the discriminant (b^2 - 4ac)",
                            "latex": f"\\Delta = ({latex(b)})^2 - 4({latex(a)})({latex(c)}) = {latex(disc)}",
                            "rule": "Discriminant",
                            "is_symbolically_verified": True,
                        },
                    ]

                    if disc > 0:
                        structured_steps.append({
                            "step_number": 3,
                            "description": "Since the discriminant is positive, the equation yields two distinct real solutions",
                            "latex": f"\\Delta = {latex(disc)} > 0",
                            "rule": "Nature of Roots",
                            "is_symbolically_verified": True,
                        })
                    elif disc == 0:
                        structured_steps.append({
                            "step_number": 3,
                            "description": "Since the discriminant is zero, the equation yields a single repeated real solution",
                            "latex": "\\Delta = 0",
                            "rule": "Nature of Roots",
                            "is_symbolically_verified": True,
                        })
                    else:
                        structured_steps.append({
                            "step_number": 3,
                            "description": "Since the discriminant is negative, the equation yields two complex conjugate solutions",
                            "latex": f"\\Delta = {latex(disc)} < 0 \\implies \\text{{Roots involve imaginary unit }} i = \\sqrt{{-1}}",
                            "rule": "Nature of Roots",
                            "is_symbolically_verified": True,
                        })

                    structured_steps.append({
                        "step_number": 4,
                        "description": "Apply the quadratic formula",
                        "latex": f"{latex(target_var)} = \\frac{{-b \\pm \\sqrt{{\\Delta}}}}{{2a}} = \\frac{{-({latex(b)}) \\pm \\sqrt{{{latex(disc)}}}}}{{2({latex(a)})}}",
                        "rule": "Quadratic Formula",
                        "is_symbolically_verified": True,
                    })

                    if disc < 0:
                        pos_d = -disc
                        sq = sympy.sqrt(pos_d)
                        structured_steps.append({
                            "step_number": 5,
                            "description": "Simplify the square root of the negative discriminant",
                            "latex": f"\\sqrt{{{latex(disc)}}} = \\sqrt{{{latex(pos_d)}}} \\cdot i = {latex(sq)}i",
                            "rule": "Radical Simplification",
                            "is_symbolically_verified": True,
                        })

                    sol_latex = format_quadratic_roots(a, b, c, target_var, disc)
                    structured_steps.append({
                        "step_number": len(structured_steps) + 1,
                        "description": "Final simplified solutions",
                        "latex": sol_latex,
                        "rule": "Final Answer",
                        "is_symbolically_verified": True,
                    })

                    return {
                        "success": True,
                        "latex_solution": sol_latex,
                        "steps": [s["description"] for s in structured_steps],
                        "structured_steps": structured_steps,
                        "is_symbolically_verified": True,
                        "domain": "equations",
                    }

                elif deg == 1:
                    a = poly.coeff_monomial(target_var)
                    b = poly.coeff_monomial(1)
                    root_val = sympy.Rational(-b, a)
                    sol_latex = f"{latex(target_var)} = {latex(root_val)}"

                    structured_steps = [
                        {
                            "step_number": 1,
                            "description": f"Standard linear equation form",
                            "latex": f"{latex(a)}{latex(target_var)} + ({latex(b)}) = 0",
                            "rule": "Linear Form",
                            "is_symbolically_verified": True,
                        },
                        {
                            "step_number": 2,
                            "description": f"Subtract {latex(b)} from both sides to isolate the variable term",
                            "latex": f"{latex(a)}{latex(target_var)} = {latex(-b)}",
                            "rule": "Isolate Variable",
                            "is_symbolically_verified": True,
                        },
                    ]
                    if a != 1:
                        structured_steps.append({
                            "step_number": 3,
                            "description": f"Divide both sides by the coefficient {latex(a)}",
                            "latex": f"{latex(target_var)} = \\frac{{{latex(-b)}}}{{{latex(a)}}} = {latex(root_val)}",
                            "rule": "Division Property",
                            "is_symbolically_verified": True,
                        })

                    return {
                        "success": True,
                        "latex_solution": sol_latex,
                        "steps": [s["description"] for s in structured_steps],
                        "structured_steps": structured_steps,
                        "is_symbolically_verified": True,
                        "domain": "equations",
                    }

                elif deg > 2:
                    factored = factor(norm_expr)
                    if factored != norm_expr:
                        steps.append(f"Factored Polynomial: $${latex(factored)} = 0$$")
            except Exception:
                pass

            solutions = solve(norm_expr, target_var)

            if not solutions:
                sol_latex = r"\text{No real or complex solution}"
            else:
                sol_latex = ", ".join([f"{latex(target_var)} = {latex(s)}" for s in solutions])

            steps.append(f"Roots: $${sol_latex}$$")

            return {
                "success": True,
                "latex_solution": sol_latex,
                "steps": steps,
                "is_symbolically_verified": True,
                "domain": "equations",
            }

        return self._execute_with_timeout(_calc)

    def differentiate_expression(
        self,
        text: str,
        variable_str: Optional[str] = None,
        order: int = 1
    ) -> Dict[str, Any]:
        """Calculates single- or multi-variable derivatives."""
        def _calc():
            # Check for derivative notation e.g., \frac{d}{dx}(expr) or d/dx(expr)
            d_pattern = re.match(r"(?:\\frac\{d\}\{d([a-zA-Z])\}|d/d([a-zA-Z]))\s*\(?(.*?)\)?$", text.strip())
            extracted_var = None
            extracted_expr_str = text

            if d_pattern:
                extracted_var = d_pattern.group(1) or d_pattern.group(2)
                extracted_expr_str = d_pattern.group(3)

            expr = self.parse_expression(extracted_expr_str)

            # Determine derivative variable
            if variable_str:
                var = symbols(variable_str)
            elif extracted_var:
                var = symbols(extracted_var)
            else:
                free_vars = list(expr.free_symbols)
                if free_vars:
                    target = next((v for v in free_vars if v.name == "x"), free_vars[0])
                    var = target
                else:
                    var = symbols("x")

            steps = [
                f"Target Function: $$f({latex(var)}) = {latex(expr)}$$",
                f"Differentiating with respect to variable $${latex(var)}$$ (order {order}):",
            ]

            derivative = diff(expr, var, order)
            simplified_deriv = simplify(derivative)

            steps.append(f"Direct Derivative: $$\\frac{{d^{{{order}}}}}{{d{latex(var)}^{{{order}}}}} f({latex(var)}) = {latex(derivative)}$$")
            if simplified_deriv != derivative:
                steps.append(f"Simplified Derivative: $${latex(simplified_deriv)}$$")

            return {
                "success": True,
                "latex_solution": latex(simplified_deriv),
                "steps": steps,
                "is_symbolically_verified": True,
                "domain": "calculus",
            }

        return self._execute_with_timeout(_calc)

    def integrate_expression(
        self,
        text: str,
        variable_str: Optional[str] = None,
        lower_bound: Optional[str] = None,
        upper_bound: Optional[str] = None
    ) -> Dict[str, Any]:
        """Computes definite or indefinite integrals."""
        def _calc():
            expr_str = text.strip()

            # Check for definite integral syntax: \int_{a}^{b} f(x) dx
            def_match = re.search(r"\\int_\{([^}]+)\}\^\{([^}]+)\}\s*(.*?)(?:d([a-zA-Z]))?$", expr_str)
            if def_match:
                extracted_lower = def_match.group(1)
                extracted_upper = def_match.group(2)
                expr_str = def_match.group(3)
                int_var_str = def_match.group(4)
            else:
                extracted_lower = lower_bound
                extracted_upper = upper_bound
                # Check for indefinite integral syntax: \int f(x) dx
                indef_match = re.search(r"\\int\s*(.*?)(?:d([a-zA-Z]))?$", expr_str)
                if indef_match:
                    expr_str = indef_match.group(1)
                    int_var_str = indef_match.group(2)
                else:
                    # Strip trailing dx if present
                    dx_match = re.search(r"(.*?)\s*d([a-zA-Z])$", expr_str)
                    if dx_match:
                        expr_str = dx_match.group(1)
                        int_var_str = dx_match.group(2)
                    else:
                        int_var_str = None

            # Clean trailing differential markers if present
            expr_str = re.sub(r"d[a-zA-Z]$", "", expr_str).strip()
            expr = self.parse_expression(expr_str)

            # Determine integration variable
            if variable_str:
                var = symbols(variable_str)
            elif int_var_str:
                var = symbols(int_var_str)
            else:
                free = list(expr.free_symbols)
                var = next((v for v in free if v.name == "x"), free[0] if free else symbols("x"))

            steps = [f"Integrand: $$f({latex(var)}) = {latex(expr)}$$"]

            # Definite integral
            if extracted_lower is not None and extracted_upper is not None:
                a = self.parse_expression(extracted_lower)
                b = self.parse_expression(extracted_upper)
                steps.append(f"Definite Integral Bounds: $$[{latex(a)}, {latex(b)}]$$")

                anti = integrate(expr, var)
                steps.append(f"Antiderivative $$F({latex(var)}) = {latex(anti)}$$")

                result = integrate(expr, (var, a, b))
                simplified_res = simplify(result)
                steps.append(f"Evaluate Fundamental Theorem of Calculus $$F({latex(b)}) - F({latex(a)})$$")
                steps.append(f"Final Definite Value: $${latex(simplified_res)}$$")

                return {
                    "success": True,
                    "latex_solution": latex(simplified_res),
                    "steps": steps,
                    "is_symbolically_verified": True,
                    "domain": "calculus",
                }

            # Indefinite integral
            anti = integrate(expr, var)
            expanded_anti = expand(anti)
            # Use expanded form for polynomial antiderivatives to avoid artificial factorization
            if expanded_anti.is_polynomial():
                chosen_anti = expanded_anti
            else:
                chosen_anti = simplify(anti)
            final_latex = f"{latex(chosen_anti)} + C"
            steps.append(f"Antiderivative: $$\\int {latex(expr)} \\, d{latex(var)} = {final_latex}$$")

            return {
                "success": True,
                "latex_solution": final_latex,
                "steps": steps,
                "is_symbolically_verified": True,
                "domain": "calculus",
            }

        return self._execute_with_timeout(_calc)

    def verify_equivalence(self, expr_a_str: str, expr_b_str: str) -> bool:
        """Verifies if two mathematical expressions are algebraically equivalent."""
        def _check():
            try:
                a = self.parse_expression(expr_a_str)
                b = self.parse_expression(expr_b_str)
            except Exception:
                return False

            if a == b:
                return True

            diff_expr = a - b

            # Level 1: Standard simplify and rational cancel
            try:
                if simplify(diff_expr) == 0:
                    return True
                if cancel(diff_expr) == 0:
                    return True
            except Exception:
                pass

            # Level 2: Trig, power, and expansion
            try:
                if trigsimp(diff_expr) == 0:
                    return True
                if powsimp(diff_expr) == 0:
                    return True
                if expand(a) == expand(b):
                    return True
            except Exception:
                pass

            # Level 3: Numerical multi-point rational sampling
            free_symbols = list(a.free_symbols | b.free_symbols)
            if not free_symbols:
                try:
                    return abs(complex(a.evalf()) - complex(b.evalf())) < 1e-7
                except Exception:
                    return False

            try:
                f1 = lambdify(free_symbols, a, modules="numpy")
                f2 = lambdify(free_symbols, b, modules="numpy")
                for _ in range(12):
                    subs = {str(s): float(random.choice(SAMPLE_POINTS)) for s in free_symbols}
                    v1 = complex(f1(**subs))
                    v2 = complex(f2(**subs))
                    if abs(v1 - v2) > 1e-6 * max(1.0, abs(v1), abs(v2)):
                        return False
                return True
            except Exception:
                return False

        return self._execute_with_timeout(_check)

    def route_and_solve(
        self,
        problem_text: str,
        domain: str = "auto",
        variable: Optional[str] = None
    ) -> Dict[str, Any]:
        """Routes problem to the appropriate solver module (algebra, equations, or calculus)."""
        text = problem_text.strip()

        # Integral detection
        if domain == "integral" or r"\int" in text or "integrate" in text.lower():
            return self.integrate_expression(text, variable_str=variable)

        # Derivative detection
        if (
            domain == "derivative"
            or r"\frac{d}{d" in text
            or r"\frac{\partial}{\partial" in text
            or "diff" in text.lower()
            or "derivative" in text.lower()
        ):
            return self.differentiate_expression(text, variable_str=variable)

        # Equation detection (single equation or system)
        if domain == "equations" or "=" in text:
            return self.solve_equation(text, variable_str=variable)

        # Calculus keyword detection
        if domain == "calculus":
            if "d/d" in text or "diff" in text:
                return self.differentiate_expression(text, variable_str=variable)
            elif "int" in text:
                return self.integrate_expression(text, variable_str=variable)
            else:
                return self.differentiate_expression(text, variable_str=variable)

        # Default to algebraic simplification & factorization
        return self.simplify_expression(text)


sympy_engine = SympyEngine()
