"""Integration tests for OCR extraction API and LaTeX sanitization."""
from __future__ import annotations

import io
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.services.gemini_bridge import gemini_bridge


def create_mock_equation_image(width: int = 400, height: int = 200) -> bytes:
    """Creates a valid synthetic image buffer."""
    buf = io.BytesIO()
    img = Image.new("RGB", (width, height), color="white")
    img.save(buf, format="PNG")
    return buf.getvalue()


class TestSanitizeLatex:
    """Tests for LaTeX string sanitization logic in GeminiBridge."""

    def test_strip_markdown_code_fences(self):
        raw = "```latex\n\\frac{a}{b} = c\n```"
        cleaned = gemini_bridge.sanitize_latex(raw)
        assert cleaned == "\\frac{a}{b} = c"

    def test_strip_generic_code_fences(self):
        raw = "```\nx^2 + y^2 = r^2\n```"
        cleaned = gemini_bridge.sanitize_latex(raw)
        assert cleaned == "x^2 + y^2 = r^2"

    def test_strip_enclosing_dollar_signs(self):
        raw = "$$\\int_{0}^{1} x dx$$"
        cleaned = gemini_bridge.sanitize_latex(raw)
        assert cleaned == "\\int_{0}^{1} x dx"

    def test_strip_conversational_prefixes(self):
        raw = "Here is the LaTeX equation: \\sqrt{x} = 2"
        cleaned = gemini_bridge.sanitize_latex(raw)
        assert cleaned == "\\sqrt{x} = 2"


class TestOcrApiEndpoints:
    """Tests for /api/v1/ocr/extract endpoint."""

    def test_ocr_extract_valid_image(self, client: TestClient):
        img_bytes = create_mock_equation_image()
        files = {
            "file": ("equation.png", img_bytes, "image/png"),
        }
        response = client.post("/api/v1/ocr/extract", files=files)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "latex" in data
        assert len(data["latex"]) > 0
        assert data["confidence"] > 0
        assert "image_dimensions" in data
        assert data["image_dimensions"] == [400, 200]
        assert data["execution_time_ms"] > 0

    def test_ocr_extract_invalid_mime_type(self, client: TestClient):
        files = {
            "file": ("doc.txt", b"plain text is not an image", "text/plain"),
        }
        response = client.post("/api/v1/ocr/extract", files=files)
        assert response.status_code == 400
        assert "Unsupported image MIME type" in response.json()["detail"]

    def test_ocr_extract_empty_file(self, client: TestClient):
        files = {
            "file": ("empty.png", b"", "image/png"),
        }
        response = client.post("/api/v1/ocr/extract", files=files)
        assert response.status_code == 400
        assert "Uploaded image is empty" in response.json()["detail"]

    def test_ocr_extract_corrupted_image(self, client: TestClient):
        files = {
            "file": ("corrupt.png", b"not-really-a-png-file", "image/png"),
        }
        response = client.post("/api/v1/ocr/extract", files=files)
        assert response.status_code == 400
        assert "Unable to decode image data" in response.json()["detail"]
