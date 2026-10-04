"""API v1 Router aggregation."""
from __future__ import annotations

from fastapi import APIRouter
from app.api.v1.endpoints import health, ocr, solve

api_router = APIRouter()

# Health endpoints
api_router.include_router(health.router, tags=["Health"])

# Core Solver endpoint
api_router.include_router(solve.router, tags=["Solver"])

# Multimodal OCR endpoint
api_router.include_router(ocr.router, prefix="/ocr", tags=["OCR"])

