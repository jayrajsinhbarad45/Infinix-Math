"""API Integration tests for FastAPI endpoints."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


def test_root_endpoint(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "Infinix Math"
    assert "version" in data


def test_healthz_endpoint(client: TestClient):
    response = client.get("/api/v1/healthz")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert data["sympy_engine"] == "operational"


def test_solve_algebra_endpoint(client: TestClient):
    payload = {
        "problem_text": "(x + 3)(x - 3)",
        "domain": "algebra",
    }
    response = client.post("/api/v1/solve", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "x^{2} - 9" in data["latex_solution"]
    assert data["is_symbolically_verified"] is True
    assert len(data["steps"]) >= 1
    assert data["execution_time_ms"] > 0


def test_solve_equation_endpoint(client: TestClient):
    payload = {
        "problem_text": "x^2 - 4 = 0",
        "domain": "equations",
    }
    response = client.post("/api/v1/solve", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "2" in data["latex_solution"]
    assert "-2" in data["latex_solution"]
    assert data["is_symbolically_verified"] is True


def test_solve_derivative_endpoint(client: TestClient):
    payload = {
        "problem_text": r"\frac{d}{dx}(x^3 + 2x)",
        "domain": "calculus",
    }
    response = client.post("/api/v1/solve", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "3 x^{2} + 2" in data["latex_solution"] or "3x^2 + 2" in data["latex_solution"].replace(" ", "")
    assert data["is_symbolically_verified"] is True


def test_solve_definite_integral_endpoint(client: TestClient):
    payload = {
        "problem_text": r"\int_{0}^{2} x dx",
        "domain": "integral",
    }
    response = client.post("/api/v1/solve", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["latex_solution"] == "2"
    assert data["is_symbolically_verified"] is True


def test_solve_system_of_equations(client: TestClient):
    payload = {
        "problem_text": "x + y = 10, x - y = 2",
        "domain": "auto",
    }
    response = client.post("/api/v1/solve", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "x = 6" in data["latex_solution"]
    assert "y = 4" in data["latex_solution"]


def test_solve_validation_error(client: TestClient):
    # Empty problem_text should trigger 422 or 400
    response = client.post("/api/v1/solve", json={"problem_text": "", "domain": "algebra"})
    assert response.status_code in [400, 422]
