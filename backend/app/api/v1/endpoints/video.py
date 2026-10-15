"""Video Generation API Endpoint using Manim and Edge-TTS."""
from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from app.services.manim_video_service import (
    MEDIA_DIR,
    generate_manim_video_sync,
)
from app.services.sympy_engine import SympyEngine

router = APIRouter()


class VideoGenerateRequest(BaseModel):
    problem_text: str = Field(..., description="The mathematical equation or formula")
    solution_latex: Optional[str] = Field(None, description="The solved LaTeX result")
    steps: Optional[List[Dict[str, Any]]] = Field(None, description="Structured step-by-step derivation")
    voice: str = Field("en-US-AriaNeural", description="Edge-TTS voice persona")


class VideoGenerateResponse(BaseModel):
    success: bool
    video_id: str
    filename: str
    duration_seconds: float
    url: str


@router.post(
    "/generate",
    response_model=VideoGenerateResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate Manim Video with Step Animations and Voice Narration",
)
async def generate_video(payload: VideoGenerateRequest) -> VideoGenerateResponse:
    """Renders a 3Blue1Brown-style Manim explainer video for the math problem

    including synchronized Edge-TTS voice explanation and coordinate graphing.
    """
    problem = payload.problem_text.strip()
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="problem_text cannot be empty",
        )

    # If steps were not provided in payload, solve via SymPy engine first
    solution_latex = payload.solution_latex
    steps = payload.steps

    if not solution_latex or not steps:
        engine = SympyEngine()
        solve_res = engine.solve(problem)
        solution_latex = solve_res.latex_solution
        steps = [
            {"step_number": s.step_number, "description": s.description, "latex": s.latex}
            for s in solve_res.structured_steps
        ]

    try:
        # Run in threadpool so FastAPI event loop isn't blocked during video rendering
        res = await asyncio.to_thread(
            generate_manim_video_sync,
            problem_text=problem,
            solution_latex=solution_latex,
            steps=steps,
            voice=payload.voice,
        )

        return VideoGenerateResponse(
            success=True,
            video_id=res["video_id"],
            filename=res["filename"],
            duration_seconds=res["duration_seconds"],
            url=res["url"],
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Video rendering failed: {str(exc)}",
        ) from exc


@router.get(
    "/stream/{video_id}",
    summary="Stream or download generated MP4 video",
)
async def stream_video(video_id: str) -> FileResponse:
    """Streams the rendered MP4 video file directly to the video player."""
    clean_id = Path(video_id).stem
    file_path = MEDIA_DIR / f"{clean_id}.mp4"

    if not file_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found or expired",
        )

    return FileResponse(
        path=str(file_path),
        media_type="video/mp4",
        filename=f"infinix_math_{clean_id}.mp4",
    )
