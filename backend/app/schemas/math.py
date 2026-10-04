"""Pydantic schemas for mathematical payloads and API contracts."""
from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class MathDomain(str, Enum):
    ALGEBRA = "algebra"
    EQUATIONS = "equations"
    CALCULUS = "calculus"
    DERIVATIVE = "derivative"
    INTEGRAL = "integral"
    GENERAL = "general"
    AUTO = "auto"


class MathStep(BaseModel):
    step_number: int = Field(..., description="Sequential step index (1-based)")
    description: str = Field(..., description="Pedagogical explanation of the step")
    latex: str = Field(..., description="LaTeX representation of this intermediate step")
    rule: Optional[str] = Field(default=None, description="Mathematical rule or property applied")
    is_symbolically_verified: bool = Field(default=True, description="Whether verified with SymPy")


class SolveRequest(BaseModel):
    problem_text: str = Field(
        ...,
        min_length=1,
        description="The mathematical problem text or LaTeX string to solve",
        examples=["x^2 - 5x + 6 = 0", "\\int x \\cos(x) dx", "x^3 + 3x^2 - 4x - 12", "\\frac{d}{dx}(x^3 \\sin(x))"]
    )
    domain: MathDomain = Field(
        default=MathDomain.AUTO,
        description="Target mathematical domain (e.g. algebra, calculus, equations, auto)"
    )
    variable: Optional[str] = Field(
        default=None,
        description="Target variable of interest (e.g., 'x', 't'). Defaults to auto-detection."
    )


class SolveResponse(BaseModel):
    success: bool = Field(..., description="Whether the problem was successfully solved")
    latex_solution: str = Field(..., description="Canonical final answer in formatted LaTeX")
    steps: List[str] = Field(default_factory=list, description="List of step descriptions with LaTeX")
    is_symbolically_verified: bool = Field(
        default=False,
        description="Whether the solution was verified by the deterministic SymPy engine"
    )
    domain: str = Field(default="general", description="Detected or specified mathematical domain")
    structured_steps: List[MathStep] = Field(
        default_factory=list,
        description="Detailed structured steps with metadata"
    )
    execution_time_ms: float = Field(default=0.0, description="Execution time in milliseconds")
    error: Optional[str] = Field(default=None, description="Error message if solving failed")


class StepVerificationStatus(str, Enum):
    CORRECT = "correct"
    INCORRECT_MATH = "incorrect_math"
    INCOMPLETE = "incomplete"
    UNCLEAR = "unclear"


class StepVerificationRequest(BaseModel):
    problem: str = Field(..., description="Original problem statement or equation")
    previous_steps: List[str] = Field(default_factory=list, description="List of previous valid derivation steps")
    proposed_step: str = Field(..., description="The student's proposed next step")
    variable: Optional[str] = Field(default=None, description="Target variable of interest")


class StepVerificationResponse(BaseModel):
    is_valid: bool = Field(..., description="Whether the proposed step is mathematically valid and equivalent")
    status: StepVerificationStatus = Field(..., description="Status classification (correct, incorrect_math, etc.)")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0, description="Verification confidence score")
    evidence: str = Field(..., description="Pedagogical explanation of why the step is valid or where the error occurred")
    error_code: Optional[str] = Field(default=None, description="Taxonomy error code if invalid (e.g. SIGN_ERROR, CHAIN_RULE_MISUSE)")
    suggested_correction: Optional[str] = Field(default=None, description="Suggested correct mathematical step")
    pedagogical_hint: Optional[str] = Field(default=None, description="Scaffolding hint to guide student to correct derivation")
    is_symbolically_verified: bool = Field(default=True, description="Whether verified with SymPy")
    is_final_step: bool = Field(default=False, description="Whether this step represents the final solved answer")
    execution_time_ms: float = Field(default=0.0, description="Verification latency in milliseconds")


class TutorHintRequest(BaseModel):
    problem: str = Field(..., description="Original problem statement")
    current_steps: List[str] = Field(default_factory=list, description="Steps completed so far")


class TutorHintResponse(BaseModel):
    hint: str = Field(..., description="Scaffolding hint explaining the next mathematical strategy")
    suggested_technique: Optional[str] = Field(default=None, description="Mathematical rule or technique to apply")


# Backward compatibility aliases
VerificationRequest = StepVerificationRequest
VerificationResponse = StepVerificationResponse



class OcrExtractResponse(BaseModel):
    success: bool = Field(..., description="Whether mathematical LaTeX was successfully extracted")
    latex: str = Field(..., description="Extracted mathematical expression in standard LaTeX notation")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0, description="Estimated extraction confidence")
    detected_domain: str = Field(default="general", description="Auto-detected mathematical domain")
    warnings: List[str] = Field(default_factory=list, description="Any extraction or sanitization notices")
    execution_time_ms: float = Field(default=0.0, description="Time taken for image processing and OCR in ms")
    image_dimensions: Optional[List[int]] = Field(default=None, description="Processed image dimensions [width, height]")

