"""Health check endpoints for container and cluster liveness/readiness probes."""
from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter
from app.core.config import settings
from app.services.sympy_engine import sympy_engine
from app.services.gemini_bridge import gemini_bridge

router = APIRouter()


@router.get("/healthz", summary="Liveness and Readiness Health Check")
async def health_check() -> Dict[str, Any]:
    """Returns application status, version, and dependency availability."""
    # Test SymPy engine responsiveness
    try:
        test_expr = sympy_engine.parse_expression("x + 1")
        sympy_ok = test_expr is not None
    except Exception:
        sympy_ok = False

    return {
        "status": "healthy" if sympy_ok else "degraded",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "sympy_engine": "operational" if sympy_ok else "unavailable",
        "gemini_bridge": "connected" if gemini_bridge.is_available() else "mock_fallback_mode",
    }
