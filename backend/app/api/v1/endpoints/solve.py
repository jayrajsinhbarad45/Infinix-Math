"""Mathematical Solver API endpoint."""
from __future__ import annotations

import logging
import time
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException, status

from app.schemas.math import MathDomain, MathStep, SolveRequest, SolveResponse
from app.services.gemini_bridge import gemini_bridge
from app.services.sympy_engine import sympy_engine

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/solve",
    response_model=SolveResponse,
    summary="Solve mathematical problems with deterministic symbolic verification",
    description=(
        "Parses input equations or expressions, routes to SymPy for deterministic "
        "computation, and returns step-by-step verified LaTeX derivations."
    ),
)
async def solve_math_problem(request: SolveRequest) -> SolveResponse:
    start_time = time.perf_counter()
    problem_text = request.problem_text.strip()

    if not problem_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="problem_text cannot be empty",
        )

    # Step 1: Pre-process natural language problem if needed
    domain_val = request.domain.value if hasattr(request.domain, "value") else str(request.domain)
    target_var = request.variable
    cleaned_math_str = problem_text

    # If the input contains words like "derivative", "integrate", "solve for", parse with bridge
    has_prose = any(w in problem_text.lower() for w in ["find", "solve", "what is", "calculate", "derivative of", "integral of"])
    if has_prose:
        decomp = gemini_bridge.parse_natural_language_math(problem_text)
        cleaned_math_str = decomp.get("latex", problem_text)
        if domain_val == MathDomain.AUTO.value:
            domain_val = decomp.get("domain", domain_val)
        if not target_var:
            target_var = decomp.get("variable", "x")

    # Step 2: Attempt deterministic symbolic solution via SymPy
    try:
        engine_result = sympy_engine.route_and_solve(
            cleaned_math_str,
            domain=domain_val,
            variable=target_var,
        )

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

        # Convert steps into structured step models
        raw_steps: List[str] = engine_result.get("steps", [])
        structured_steps = [
            MathStep(
                step_number=idx,
                description=step.split(":")[0] if ":" in step else f"Step {idx}",
                latex=step,
                rule="Symbolic Derivation",
                is_symbolically_verified=True,
            )
            for idx, step in enumerate(raw_steps, 1)
        ]

        return SolveResponse(
            success=True,
            latex_solution=engine_result.get("latex_solution", ""),
            steps=raw_steps,
            is_symbolically_verified=True,
            domain=engine_result.get("domain", domain_val),
            structured_steps=structured_steps,
            execution_time_ms=elapsed_ms,
        )

    except (ValueError, TimeoutError) as sym_err:
        logger.warning("Deterministic SymPy execution failed on %r: %s", problem_text, sym_err)

        # Step 3: Graceful fallback logic as specified in the roadmap:
        # "attempt SymPy execution first; use Gemini reasoning with strict warnings if symbolic parsing fails"
        if gemini_bridge.is_available():
            try:
                # Query Gemini with strict warning payload
                explanation_steps = gemini_bridge.generate_pedagogical_explanation(
                    problem_latex=problem_text,
                    symbolic_steps=[f"Warning: Symbolic parser encountered: {str(sym_err)}"],
                    final_answer=r"\text{Evaluated via LLM reasoning}",
                )
                elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
                return SolveResponse(
                    success=True,
                    latex_solution=r"\text{Symbolic check inconclusive; evaluated via pedagogical AI}",
                    steps=explanation_steps,
                    is_symbolically_verified=False,
                    domain="general",
                    execution_time_ms=elapsed_ms,
                    error=f"Symbolic parser notice: {str(sym_err)}",
                )
            except Exception as bridge_err:
                logger.error("Gemini fallback also failed: %s", bridge_err)

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return SolveResponse(
            success=False,
            latex_solution=r"\text{Unable to solve}",
            steps=[f"Error: {str(sym_err)}"],
            is_symbolically_verified=False,
            domain=domain_val,
            execution_time_ms=elapsed_ms,
            error=str(sym_err),
            structured_steps=[
                MathStep(
                    step_number=1,
                    description="Parsing Notice",
                    latex=f"\\text{{Unable to parse expression: }} {str(sym_err)}",
                    rule="Input Validation",
                    is_symbolically_verified=False,
                )
            ],
        )
    except Exception as exc:
        logger.exception("Unexpected error solving %r", problem_text)
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return SolveResponse(
            success=False,
            latex_solution=r"\text{Computation Error}",
            steps=[f"Internal solver error: {str(exc)}"],
            is_symbolically_verified=False,
            domain=domain_val,
            execution_time_ms=elapsed_ms,
            error=str(exc),
            structured_steps=[
                MathStep(
                    step_number=1,
                    description="Computation Notice",
                    latex=f"\\text{{Internal solver notice: }} {str(exc)}",
                    rule="System Error Handling",
                    is_symbolically_verified=False,
                )
            ],
        )
