"""Multimodal OCR API endpoint for extracting mathematical equations into LaTeX."""
from __future__ import annotations

import logging
import time
from typing import List

from fastapi import APIRouter, File, HTTPException, Query, UploadFile, status

from app.schemas.math import OcrExtractResponse
from app.services.gemini_bridge import gemini_bridge
from app.services.image_processor import ALLOWED_MIME_TYPES, image_processor

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/extract",
    response_model=OcrExtractResponse,
    summary="Extract LaTeX from handwritten or printed mathematical equations",
    description=(
        "Upload an equation image (PNG, JPEG, WebP) to convert visual mathematical notation "
        "into sanitized, parseable LaTeX using Google Gemini Vision."
    ),
)
async def extract_math_from_image(
    file: UploadFile = File(..., description="Image file containing mathematical formulas"),
    preprocess: bool = Query(default=True, description="Whether to optimize contrast and dimensions"),
) -> OcrExtractResponse:
    start_time = time.perf_counter()

    # 1. Read file bytes into memory
    try:
        content_type = file.content_type or ""
        # Check filename extension as fallback if content_type is generic application/octet-stream
        filename = (file.filename or "").lower()
        if not content_type or content_type == "application/octet-stream":
            if filename.endswith((".png")):
                content_type = "image/png"
            elif filename.endswith((".jpg", ".jpeg")):
                content_type = "image/jpeg"
            elif filename.endswith((".webp")):
                content_type = "image/webp"

        image_bytes = await file.read()
    except Exception as exc:
        logger.error("Failed to read uploaded file: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file: {str(exc)}",
        )

    # 2. Validate payload size and MIME type
    try:
        image_processor.validate_image_payload(image_bytes, content_type)
    except ValueError as val_err:
        logger.warning("Image validation failed: %s", val_err)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )

    # 3. Image Optimization Pipeline
    dimensions: List[int] = [0, 0]
    final_bytes = image_bytes
    final_mime = content_type

    if preprocess:
        try:
            final_bytes, final_mime, dims = image_processor.optimize_image(
                image_bytes,
                enhance_contrast=True,
                target_format="PNG",
            )
            dimensions = [dims[0], dims[1]]
        except ValueError as proc_err:
            logger.warning("Image optimization failed: %s", proc_err)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(proc_err),
            )

    # 4. Multimodal Vision OCR extraction
    extraction = gemini_bridge.extract_latex_from_image(
        image_bytes=final_bytes,
        mime_type=final_mime,
    )

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

    return OcrExtractResponse(
        success=extraction.get("success", False),
        latex=extraction.get("latex", ""),
        confidence=extraction.get("confidence", 0.0),
        detected_domain=extraction.get("detected_domain", "general"),
        warnings=extraction.get("warnings", []),
        execution_time_ms=elapsed_ms,
        image_dimensions=dimensions if dimensions != [0, 0] else None,
    )
