"""Deterministic Step-by-Step Mathematical Verification and Diagnostic AI Tutor Engine."""
from __future__ import annotations

import json
import logging
import re
import time
from typing import Any, Dict, List, Optional, Tuple

import sympy
from sympy import Eq, simplify

from app.schemas.math import (
    StepVerificationRequest,
    StepVerificationResponse,
    StepVerificationStatus,
    TutorHintRequest,
    TutorHintResponse,
)
from app.services.gemini_bridge import gemini_bridge
from app.services.sympy_engine import sympy_engine

logger = logging.getLogger(__name__)


class TutorEngine:
    """Evaluates intermediate student derivations using SymPy ground-truth and Gemini diagnostic agent."""

    def verify_step(self, req: StepVerificationRequest) -> StepVerificationResponse:
        start_time = time.perf_counter()
        problem = req.problem.strip()
        proposed = req.proposed_step.strip()
        prev_steps = [s.strip() for s in req.previous_steps if s.strip()]

        # Baseline context to compare against
        prior_expr_str = prev_steps[-1] if prev_steps else problem

        # 1. Check for trivial identity (same string)
        if proposed == prior_expr_str:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return StepVerificationResponse(
                is_valid=True,
                status=StepVerificationStatus.INCOMPLETE,
                confidence=1.0,
                evidence="Step is identical to the previous statement. Attempt to simplify or perform an operation.",
                is_symbolically_verified=True,
                is_final_step=False,
                execution_time_ms=elapsed_ms,
            )

        # 2. Deterministic SymPy Equivalence Check
        is_equivalent, check_reason = self._check_step_equivalence(prior_expr_str, proposed, problem)

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

        if is_equivalent:
            # Check if this step is the final solved solution
            is_final = self._check_if_final_answer(problem, proposed)
            return StepVerificationResponse(
                is_valid=True,
                status=StepVerificationStatus.CORRECT,
                confidence=0.98,
                evidence=check_reason or "Mathematically valid derivation. Algebraic equivalence verified.",
                is_symbolically_verified=True,
                is_final_step=is_final,
                execution_time_ms=elapsed_ms,
            )

        # 3. Step is invalid or inconsistent -> Trigger Diagnostic Agent
        diagnosis = self._diagnose_student_mistake(
            problem=problem,
            prior_step=prior_expr_str,
            proposed_step=proposed,
        )

        return StepVerificationResponse(
            is_valid=False,
            status=StepVerificationStatus.INCORRECT_MATH,
            confidence=diagnosis.get("confidence", 0.90),
            evidence=diagnosis.get("evidence", "The proposed step is not mathematically equivalent to the previous state."),
            error_code=diagnosis.get("error_code", "ALGEBRAIC_ERROR"),
            suggested_correction=diagnosis.get("suggested_correction"),
            pedagogical_hint=diagnosis.get("pedagogical_hint"),
            is_symbolically_verified=True,
            is_final_step=False,
            execution_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
        )

    def _check_step_equivalence(
        self,
        prior: str,
        proposed: str,
        original_problem: str
    ) -> Tuple[bool, str]:
        """Evaluates whether the proposed step follows validly from prior mathematical state."""
        # Case A: Both are equations (contains =)
        if "=" in prior and "=" in proposed:
            try:
                p_parts = prior.split("=")
                q_parts = proposed.split("=")
                p_norm = sympy_engine.parse_expression(p_parts[0]) - sympy_engine.parse_expression(p_parts[1])
                q_norm = sympy_engine.parse_expression(q_parts[0]) - sympy_engine.parse_expression(q_parts[1])

                # Check if p_norm == q_norm or p_norm is a non-zero multiple of q_norm (e.g. dividing whole equation by 2)
                if sympy_engine.verify_equivalence(str(p_norm), str(q_norm)):
                    return True, "Valid algebraic equation transformation."

                ratio = simplify(p_norm / q_norm)
                if ratio.is_number and ratio != 0:
                    return True, f"Valid equation scaling (multiplied by factor of {ratio})."
            except Exception as e:
                logger.debug("Equation equivalence check exception: %s", e)

        # Case B: Standard algebraic expression equivalence
        try:
            if sympy_engine.verify_equivalence(prior, proposed):
                return True, "Valid algebraic reduction."
        except Exception as e:
            logger.debug("Expression equivalence check exception: %s", e)

        # Case C: Calculus derivation step check
        # If prior was a derivative problem e.g. \frac{d}{dx}(x^2) or problem asked for derivative
        if r"\frac{d}{d" in prior or "d/d" in prior or "derivative" in original_problem.lower():
            try:
                deriv_res = sympy_engine.differentiate_expression(prior)
                expected_deriv = deriv_res["latex_solution"]
                if sympy_engine.verify_equivalence(proposed, expected_deriv):
                    return True, "Derivative accurately evaluated."
            except Exception:
                pass

        # If prior was an integral problem e.g. \int x dx
        if r"\int" in prior or "integral" in original_problem.lower():
            try:
                is_indefinite = "_{" not in prior and "^" not in prior
                int_res = sympy_engine.integrate_expression(prior)
                expected_int = int_res["latex_solution"].replace("+ C", "").strip()
                has_constant = bool(re.search(r"\+\s*[cC]\b", proposed))
                proposed_clean = re.sub(r"\+\s*[cC]\b", "", proposed).strip()

                if sympy_engine.verify_equivalence(proposed_clean, expected_int):
                    if is_indefinite and not has_constant:
                        return False, "Omitted constant of integration (+ C)"
                    return True, "Antiderivative accurately integrated."
            except Exception:
                pass

        return False, ""

    def _check_if_final_answer(self, problem: str, proposed_step: str) -> bool:
        """Determines if the proposed step matches the final solved state of the problem."""
        try:
            canonical_solution = sympy_engine.route_and_solve(problem)
            sol_latex = canonical_solution.get("latex_solution", "")
            if not sol_latex:
                return False

            # Check direct equivalence or match
            if proposed_step.strip() == sol_latex.strip():
                return True

            # If equation e.g. "x = 3"
            if "=" in proposed_step and "=" in sol_latex:
                return sympy_engine.verify_equivalence(
                    proposed_step.replace(" ", ""),
                    sol_latex.replace(" ", "")
                )

            return sympy_engine.verify_equivalence(proposed_step, sol_latex)
        except Exception:
            return False

    def _diagnose_student_mistake(
        self,
        problem: str,
        prior_step: str,
        proposed_step: str
    ) -> Dict[str, Any]:
        """Uses Gemini Diagnostic Agent to pinpoint the root cause of mathematical errors."""
        system_instruction = (
            "You are a master STEM tutor and diagnostic grader. A student made an error transitioning from a "
            "previous mathematical step to a proposed step.\n"
            "Analyze the mistake and classify it into one of these standard taxonomy error codes:\n"
            "- SIGN_ERROR (swapped positive/negative sign)\n"
            "- DISTRIBUTION_ERROR (incorrectly distributed a constant or term into parentheses)\n"
            "- POWER_RULE_ERROR (incorrect power/derivative rule)\n"
            "- CHAIN_RULE_MISUSE (forgot inner derivative g'(x))\n"
            "- INTEGRATION_CONSTANT_OMITTED (forgot + C)\n"
            "- EXPONENT_MISAPPLICATION (multiplied exponents instead of adding, etc.)\n"
            "- ARITHMETIC_ERROR (basic addition/multiplication arithmetic mistake)\n"
            "- ALGEBRAIC_ERROR (general illegal algebra move)\n\n"
            "Return raw JSON with keys:\n"
            "{\n"
            '  "error_code": "STRING",\n'
            '  "evidence": "Friendly concise explanation in student-facing language pinpointing what went wrong",\n'
            '  "suggested_correction": "The correct next step in LaTeX",\n'
            '  "pedagogical_hint": "A guiding question or tip without giving away the full answer directly",\n'
            '  "confidence": 0.95\n'
            "}"
        )

        prompt = (
            f"Original Problem: {problem}\n"
            f"Previous Step: {prior_step}\n"
            f"Student Proposed Step: {proposed_step}\n\n"
            "Diagnose the mathematical mistake and return ONLY JSON."
        )

        if gemini_bridge.is_available():
            try:
                from google.genai import types
                client = gemini_bridge._client
                response = client.models.generate_content(
                    model=gemini_bridge.model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        temperature=0.1,
                    ),
                )
                raw = response.text.strip()
                if raw.startswith("```"):
                    raw = re.sub(r"^```(?:json)?\n?", "", raw)
                    raw = re.sub(r"\n?```$", "", raw)
                return json.loads(raw)
            except Exception as e:
                logger.warning("Gemini diagnostic agent error: %s", e)

        # Deterministic heuristic fallback if offline
        return self._heuristic_diagnosis(prior_step, proposed_step)

    def _heuristic_diagnosis(self, prior: str, proposed: str) -> Dict[str, Any]:
        """Local heuristic error classifier when Gemini is offline."""
        prior_clean = prior.replace(" ", "")
        prop_clean = proposed.replace(" ", "")

        # Check for sign errors
        if "+" in prior_clean and "-" in prop_clean:
            return {
                "error_code": "SIGN_ERROR",
                "evidence": "Check your signs. A positive term appears to have become negative unexpectedly.",
                "suggested_correction": None,
                "pedagogical_hint": "Review the sign changes when moving terms across the equals sign.",
                "confidence": 0.85,
            }

        # Check for missing integration constant
        if r"\int" in prior and "+C" not in proposed and "+c" not in proposed:
            return {
                "error_code": "INTEGRATION_CONSTANT_OMITTED",
                "evidence": "You integrated the expression, but omitted the constant of integration (+ C).",
                "suggested_correction": f"{proposed} + C",
                "pedagogical_hint": "Indefinite integrals always require an arbitrary constant of integration (+ C).",
                "confidence": 0.95,
            }

        return {
            "error_code": "ALGEBRAIC_ERROR",
            "evidence": "The proposed expression is not algebraically equivalent to the previous step.",
            "suggested_correction": None,
            "pedagogical_hint": "Try expanding or factoring the expression step-by-step.",
            "confidence": 0.80,
        }

    def generate_hint(self, req: TutorHintRequest) -> TutorHintResponse:
        """Generates a progressive pedagogical hint for the next step."""
        current_step = req.current_steps[-1] if req.current_steps else req.problem

        system_instruction = (
            "You are a patient Socratic math tutor. A student is working on a problem and needs a hint for what to do next.\n"
            "Provide a concise, encouraging scaffolding hint that suggests the next mathematical strategy "
            "WITHOUT giving away the final numerical/algebraic answer.\n"
            "Return raw JSON with keys: 'hint' and 'suggested_technique'."
        )

        prompt = (
            f"Problem: {req.problem}\n"
            f"Steps completed so far:\n" + "\n".join(req.current_steps or ["(No steps yet)"]) + "\n"
            f"Current state: {current_step}\n"
            "What strategy should the student use next?"
        )

        if gemini_bridge.is_available():
            try:
                from google.genai import types
                client = gemini_bridge._client
                response = client.models.generate_content(
                    model=gemini_bridge.model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        temperature=0.3,
                    ),
                )
                raw = response.text.strip()
                if raw.startswith("```"):
                    raw = re.sub(r"^```(?:json)?\n?", "", raw)
                    raw = re.sub(r"\n?```$", "", raw)
                data = json.loads(raw)
                return TutorHintResponse(
                    hint=data.get("hint", "Try isolating the variable or simplifying both sides."),
                    suggested_technique=data.get("suggested_technique", "Algebraic Simplification"),
                )
            except Exception as e:
                logger.warning("Gemini hint generation failed: %s", e)

        return TutorHintResponse(
            hint="Look for terms you can combine, or consider applying inverse operations to isolate the variable.",
            suggested_technique="Term Isolation",
        )


tutor_engine = TutorEngine()
