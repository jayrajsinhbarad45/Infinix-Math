"""Interactive AI Tutor and Step Verification API endpoints."""
from __future__ import annotations

import logging
from fastapi import APIRouter, HTTPException, status

from app.schemas.math import (
    StepVerificationRequest,
    StepVerificationResponse,
    TutorHintRequest,
    TutorHintResponse,
)
from app.services.tutor_engine import tutor_engine

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/verify-step",
    response_model=StepVerificationResponse,
    summary="Verify student derivation step with SymPy and diagnose errors",
    description=(
        "Checks whether a student's proposed intermediate mathematical step is validly equivalent "
        "to the previous step or expected derivations. If an error is detected, categorizes it "
        "using a structured diagnostic taxonomy (e.g. SIGN_ERROR, CHAIN_RULE_MISUSE) with remediation hints."
    ),
)
async def verify_student_step(request: StepVerificationRequest) -> StepVerificationResponse:
    if not request.problem.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Problem statement cannot be empty",
        )

    if not request.proposed_step.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Proposed step cannot be empty",
        )

    try:
        return tutor_engine.verify_step(request)
    except Exception as exc:
        logger.exception("Error verifying student step: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Tutor engine error: {str(exc)}",
        )


@router.post(
    "/hint",
    response_model=TutorHintResponse,
    summary="Get progressive scaffolding hint for next step",
    description="Generates an encouraging Socratic hint suggesting what strategy to attempt next without revealing the answer.",
)
async def get_tutor_hint(request: TutorHintRequest) -> TutorHintResponse:
    if not request.problem.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Problem statement cannot be empty",
        )

    try:
        return tutor_engine.generate_hint(request)
    except Exception as exc:
        logger.exception("Error generating tutor hint: %s", exc)
        return TutorHintResponse(
            hint="Try simplifying terms or isolating variables step by step.",
            suggested_technique="Simplification",
        )
