"""Pytest fixtures for Infinix Math test suite."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.sympy_engine import SympyEngine, sympy_engine


@pytest.fixture(scope="session")
def client() -> TestClient:
    """FastAPI TestClient fixture."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="session")
def engine() -> SympyEngine:
    """Shared SympyEngine fixture."""
    return sympy_engine
