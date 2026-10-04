"""Unit tests for TutorEngine step verification and error taxonomy."""
from __future__ import annotations

import pytest
from app.schemas.math import StepVerificationRequest, StepVerificationStatus, TutorHintRequest
from app.services.tutor_engine import tutor_engine


class TestTutorStepVerification:
    """Tests for line-by-line derivation verification."""

    def test_valid_equation_derivation(self):
        req = StepVerificationRequest(
            problem="2x + 4 = 10",
            previous_steps=[],
            proposed_step="2x = 6",
        )
        res = tutor_engine.verify_step(req)
        assert res.is_valid is True
        assert res.status == StepVerificationStatus.CORRECT
        assert res.is_symbolically_verified is True
        assert res.is_final_step is False

    def test_valid_final_answer_step(self):
        req = StepVerificationRequest(
            problem="2x + 4 = 10",
            previous_steps=["2x = 6"],
            proposed_step="x = 3",
        )
        res = tutor_engine.verify_step(req)
        assert res.is_valid is True
        assert res.status == StepVerificationStatus.CORRECT
        assert res.is_final_step is True

    def test_invalid_equation_sign_error(self):
        # 2x + 4 = 10 -> student writes 2x = 14 (added 4 instead of subtracting)
        req = StepVerificationRequest(
            problem="2x + 4 = 10",
            previous_steps=[],
            proposed_step="2x = 14",
        )
        res = tutor_engine.verify_step(req)
        assert res.is_valid is False
        assert res.status == StepVerificationStatus.INCORRECT_MATH
        assert res.error_code is not None
        assert len(res.evidence) > 0

    def test_valid_derivative_step(self):
        req = StepVerificationRequest(
            problem=r"\frac{d}{dx}(x^3 + 5x)",
            previous_steps=[],
            proposed_step="3x^2 + 5",
        )
        res = tutor_engine.verify_step(req)
        assert res.is_valid is True
        assert res.status == StepVerificationStatus.CORRECT

    def test_indefinite_integral_missing_constant(self):
        req = StepVerificationRequest(
            problem=r"\int 2x dx",
            previous_steps=[],
            proposed_step="x^2",
        )
        res = tutor_engine.verify_step(req)
        assert res.is_valid is False
        assert res.error_code == "INTEGRATION_CONSTANT_OMITTED"
        assert "+ C" in res.evidence or "+ C" in (res.suggested_correction or "")

    def test_generate_tutor_hint(self):
        req = TutorHintRequest(
            problem="3x + 9 = 24",
            current_steps=["3x = 15"],
        )
        res = tutor_engine.generate_hint(req)
        assert res.hint is not None
        assert len(res.hint) > 0
