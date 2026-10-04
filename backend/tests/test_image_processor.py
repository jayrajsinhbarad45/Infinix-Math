"""Unit tests for ImageProcessor pipeline."""
from __future__ import annotations

import io
import pytest
from PIL import Image

from app.services.image_processor import ImageProcessor, image_processor


def create_test_image(width: int = 200, height: int = 100, mode: str = "RGB", color="white") -> bytes:
    """Helper to generate in-memory test image bytes."""
    buf = io.BytesIO()
    img = Image.new(mode, (width, height), color=color)
    img.save(buf, format="PNG")
    return buf.getvalue()


class TestImageProcessorValidation:
    """Tests for image payload validation rules."""

    def test_empty_bytes_raises_error(self):
        with pytest.raises(ValueError, match="Uploaded image is empty"):
            image_processor.validate_image_payload(b"", "image/png")

    def test_oversized_payload_raises_error(self):
        huge_bytes = b"0" * (11 * 1024 * 1024)  # 11 MB
        with pytest.raises(ValueError, match="exceeds maximum allowed limit"):
            image_processor.validate_image_payload(huge_bytes, "image/png")

    def test_unsupported_mime_type_raises_error(self):
        valid_bytes = create_test_image()
        with pytest.raises(ValueError, match="Unsupported image MIME type"):
            image_processor.validate_image_payload(valid_bytes, "application/pdf")

    def test_valid_mime_types_accepted(self):
        valid_bytes = create_test_image()
        image_processor.validate_image_payload(valid_bytes, "image/png")
        image_processor.validate_image_payload(valid_bytes, "image/jpeg")
        image_processor.validate_image_payload(valid_bytes, "image/webp")


class TestImageProcessorOptimization:
    """Tests for image enhancement, resizing, and normalization."""

    def test_optimize_standard_png(self):
        img_bytes = create_test_image(width=300, height=150)
        opt_bytes, mime, dims = image_processor.optimize_image(img_bytes, enhance_contrast=True)
        assert mime == "image/png"
        assert dims == (300, 150)
        assert len(opt_bytes) > 0

    def test_optimize_rgba_converts_to_rgb(self):
        img_bytes = create_test_image(width=200, height=200, mode="RGBA", color=(255, 0, 0, 128))
        opt_bytes, mime, dims = image_processor.optimize_image(img_bytes)
        decoded = Image.open(io.BytesIO(opt_bytes))
        assert decoded.mode == "RGB"
        assert dims == (200, 200)

    def test_downscale_oversized_dimensions(self):
        # Image exceeding MAX_DIMENSION (2048)
        img_bytes = create_test_image(width=3000, height=1500)
        opt_bytes, mime, dims = image_processor.optimize_image(img_bytes)
        w, h = dims
        assert w <= 2048
        assert h <= 2048
        # Aspect ratio should remain 2:1
        assert abs((w / h) - 2.0) < 0.05

    def test_too_small_dimensions_rejected(self):
        tiny_bytes = create_test_image(width=30, height=30)
        with pytest.raises(ValueError, match="too small for OCR"):
            image_processor.optimize_image(tiny_bytes)

    def test_corrupt_image_bytes_raises_error(self):
        with pytest.raises(ValueError, match="Unable to decode image data"):
            image_processor.optimize_image(b"not-a-valid-image-stream")
