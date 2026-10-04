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


class VerificationRequest(BaseModel):
    problem: str = Field(..., description="Original problem statement")
    previous_steps: List[str] = Field(default_factory=list, description="Preceding steps")
    proposed_step: str = Field(..., description="The student's proposed next step")


class VerificationResponse(BaseModel):
    is_correct: bool = Field(..., description="Whether the proposed step is mathematically valid")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    evidence: str = Field(..., description="Detailed verification explanation")
    error_code: Optional[str] = Field(default=None, description="Taxonomy error code if invalid")
    is_symbolically_verified: bool = Field(default=True)


class OcrExtractResponse(BaseModel):
    success: bool = Field(..., description="Whether mathematical LaTeX was successfully extracted")
    latex: str = Field(..., description="Extracted mathematical expression in standard LaTeX notation")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0, description="Estimated extraction confidence")
    detected_domain: str = Field(default="general", description="Auto-detected mathematical domain")
    warnings: List[str] = Field(default_factory=list, description="Any extraction or sanitization notices")
    execution_time_ms: float = Field(default=0.0, description="Time taken for image processing and OCR in ms")
    image_dimensions: Optional[List[int]] = Field(default=None, description="Processed image dimensions [width, height]")

