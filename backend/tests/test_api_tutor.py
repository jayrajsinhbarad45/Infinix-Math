"""Integration tests for AI Tutor API endpoints."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


def test_tutor_verify_valid_step(client: TestClient):
    payload = {
        "problem": "x^2 - 9 = 0",
        "previous_steps": [],
        "proposed_step": "x^2 = 9",
    }
    response = client.post("/api/v1/tutor/verify-step", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is True
    assert data["status"] == "correct"
    assert data["is_symbolically_verified"] is True
    assert data["execution_time_ms"] > 0


def test_tutor_verify_invalid_step(client: TestClient):
    payload = {
        "problem": "x^2 - 9 = 0",
        "previous_steps": [],
        "proposed_step": "x^2 = 7",  # Incorrect
    }
    response = client.post("/api/v1/tutor/verify-step", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is False
    assert data["status"] == "incorrect_math"
    assert data["error_code"] is not None
    assert len(data["evidence"]) > 0


def test_tutor_verify_empty_input(client: TestClient):
    payload = {
        "problem": "",
        "previous_steps": [],
        "proposed_step": "x = 3",
    }
    response = client.post("/api/v1/tutor/verify-step", json=payload)
    assert response.status_code == 400


def test_tutor_hint_endpoint(client: TestClient):
    payload = {
        "problem": "\\int x \\cos(x) dx",
        "current_steps": [],
    }
    response = client.post("/api/v1/tutor/hint", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "hint" in data
    assert len(data["hint"]) > 0
