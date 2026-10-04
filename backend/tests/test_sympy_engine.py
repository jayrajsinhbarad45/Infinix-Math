"""Unit tests for deterministic SymPy computation engine."""
from __future__ import annotations

import pytest
import sympy
from sympy import Symbol, symbols

from app.services.sympy_engine import LatexParser, SympyEngine


class TestLatexParser:
    """Tests for LaTeX string conversion into SymPy-compatible math syntax."""

    def test_fractions(self):
        latex_str = r"\frac{x + 1}{x - 1}"
        parsed = LatexParser.latex_to_sympy_str(latex_str)
        assert "(x + 1)" in parsed
        assert "(x - 1)" in parsed
        assert "/" in parsed

    def test_nested_fractions(self):
        latex_str = r"\frac{\frac{1}{x}}{y}"
        parsed = LatexParser.latex_to_sympy_str(latex_str)
        assert "/" in parsed

    def test_square_roots(self):
        latex_str = r"\sqrt{x^2 + 1}"
        parsed = LatexParser.latex_to_sympy_str(latex_str)
        assert "sqrt(" in parsed
        assert "x**2 + 1" in parsed

    def test_nth_roots(self):
        latex_str = r"\sqrt[3]{x + 8}"
        parsed = LatexParser.latex_to_sympy_str(latex_str)
        assert "**(1/(3))" in parsed or "1/3" in parsed

    def test_implicit_multiplication(self):
        assert "2*x" in LatexParser.latex_to_sympy_str("2x")
        assert "3*(x + 1)" in LatexParser.latex_to_sympy_str(r"3(x + 1)")
        assert "(x + 1)*(x + 2)" in LatexParser.latex_to_sympy_str(r"(x + 1)(x + 2)")

    def test_trigonometric_normalization(self):
        latex_str = r"\sin(x) + \cos(2x) + \tan(\theta)"
        parsed = LatexParser.latex_to_sympy_str(latex_str)
        assert "sin(x)" in parsed
        assert "cos(2*x)" in parsed
        assert "tan(theta)" in parsed


class TestSympyEngineAlgebra:
    """Tests for algebraic simplification, factoring, and expansion."""

    def test_polynomial_simplification(self, engine: SympyEngine):
        res = engine.simplify_expression(r"(x + 2)(x - 2)")
        assert res["success"] is True
        assert "x^{2} - 4" in res["latex_solution"]
        assert res["is_symbolically_verified"] is True
        assert len(res["steps"]) >= 2

    def test_rational_simplification(self, engine: SympyEngine):
        res = engine.simplify_expression(r"\frac{x^2 - 1}{x - 1}")
        assert res["success"] is True
        assert res["latex_solution"] == "x + 1"
        assert res["is_symbolically_verified"] is True

    def test_trigonometric_simplification(self, engine: SympyEngine):
        res = engine.simplify_expression(r"\sin^2(x) + \cos^2(x)")
        assert res["success"] is True
        assert res["latex_solution"] == "1"


class TestSympyEngineEquations:
    """Tests for solving single equations and systems of equations."""

    def test_linear_equation(self, engine: SympyEngine):
        res = engine.solve_equation("2x + 4 = 10")
        assert res["success"] is True
        assert "x = 3" in res["latex_solution"]

    def test_quadratic_equation(self, engine: SympyEngine):
        res = engine.solve_equation("x^2 - 5x + 6 = 0")
        assert res["success"] is True
        assert "2" in res["latex_solution"]
        assert "3" in res["latex_solution"]

    def test_quadratic_with_fractions(self, engine: SympyEngine):
        res = engine.solve_equation(r"x^2 = \frac{4}{9}")
        assert res["success"] is True
        assert r"\frac{2}{3}" in res["latex_solution"] or "-2/3" in res["latex_solution"]

    def test_system_of_equations(self, engine: SympyEngine):
        # 2x + y = 7, x - y = 1 -> 3x = 8 -> x = 8/3, y = 5/3
        res = engine.solve_equation("2x + y = 7, x - y = 1")
        assert res["success"] is True
        assert "x" in res["latex_solution"]
        assert "y" in res["latex_solution"]
        assert r"\frac{8}{3}" in res["latex_solution"]
        assert r"\frac{5}{3}" in res["latex_solution"]


class TestSympyEngineCalculus:
    """Tests for single & multivariable derivatives and definite/indefinite integrals."""

    def test_single_derivative_polynomial(self, engine: SympyEngine):
        res = engine.differentiate_expression(r"\frac{d}{dx}(3x^4 - 5x^2 + 7)")
        assert res["success"] is True
        assert "12 x^{3} - 10 x" in res["latex_solution"] or "12x^3 - 10x" in res["latex_solution"].replace(" ", "")

    def test_derivative_product_rule(self, engine: SympyEngine):
        res = engine.differentiate_expression(r"x^2 \sin(x)")
        assert res["success"] is True
        # derivative is x*(x*cos(x) + 2*sin(x)) or 2x*sin(x) + x^2*cos(x)
        assert "x" in res["latex_solution"]
        assert r"\sin" in res["latex_solution"] or "sin" in res["latex_solution"]
        assert r"\cos" in res["latex_solution"] or "cos" in res["latex_solution"]

    def test_higher_order_derivative(self, engine: SympyEngine):
        res = engine.differentiate_expression("x^4", order=2)
        assert res["success"] is True
        assert "12 x^{2}" in res["latex_solution"] or "12x^2" in res["latex_solution"].replace(" ", "")

    def test_multivariable_partial_derivative(self, engine: SympyEngine):
        # Partial derivative of x^2 * y^3 with respect to y is 3*x^2*y^2
        res = engine.differentiate_expression(r"x^2 y^3", variable_str="y")
        assert res["success"] is True
        assert "3 x^{2} y^{2}" in res["latex_solution"] or "3x^2y^2" in res["latex_solution"].replace(" ", "")

    def test_indefinite_integral(self, engine: SympyEngine):
        res = engine.integrate_expression(r"\int (3x^2 + 2x + 1) dx")
        assert res["success"] is True
        assert "+ C" in res["latex_solution"]
        assert "x^{3}" in res["latex_solution"]
        assert "x^{2}" in res["latex_solution"]

    def test_definite_integral_polynomial(self, engine: SympyEngine):
        # Integral of x^2 from 0 to 3 = [x^3/3]_0^3 = 9
        res = engine.integrate_expression(r"\int_{0}^{3} x^2 dx")
        assert res["success"] is True
        assert res["latex_solution"] == "9"

    def test_definite_integral_trigonometric(self, engine: SympyEngine):
        # Integral of sin(x) from 0 to pi = [-cos(x)]_0^pi = -(-1) - (-1) = 2
        res = engine.integrate_expression(r"\int_{0}^{\pi} \sin(x) dx")
        assert res["success"] is True
        assert res["latex_solution"] == "2"


class TestSympyEngineEquivalence:
    """Tests for symbolic and numerical equivalence validation."""

    def test_algebraic_identity(self, engine: SympyEngine):
        assert engine.verify_equivalence("(x + 1)^2", "x^2 + 2x + 1") is True

    def test_trigonometric_identity(self, engine: SympyEngine):
        assert engine.verify_equivalence(r"\sin^2(x) + \cos^2(x)", "1") is True

    def test_non_equivalent_expressions(self, engine: SympyEngine):
        assert engine.verify_equivalence("x^2 + 1", "x^2 - 1") is False

    def test_complex_fractions_equivalence(self, engine: SympyEngine):
        assert engine.verify_equivalence(r"\frac{1}{x} + \frac{1}{y}", r"\frac{x + y}{x y}") is True


class TestSympyEngineSafety:
    """Tests for safety limits, invalid syntax handling, and timeouts."""

    def test_invalid_syntax_raises_value_error(self, engine: SympyEngine):
        with pytest.raises(ValueError):
            engine.parse_expression("+++***///invalid")

    def test_ast_size_limit_rejection(self, engine: SympyEngine):
        massive_input = "x + " * 300 + "1"
        with pytest.raises(ValueError, match="exceeds maximum allowed AST size"):
            engine.parse_expression(massive_input)
