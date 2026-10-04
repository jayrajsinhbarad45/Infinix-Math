"""Image Preprocessing and Normalization Pipeline for Mathematical OCR."""
from __future__ import annotations

import io
import logging
from typing import Tuple

from PIL import Image, ImageEnhance, ImageOps

logger = logging.getLogger(__name__)

# Allowed MIME types for OCR upload
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/bmp",
}

# 10 MB maximum upload size
MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024
# Maximum dimension for Gemini Vision input (maintains clarity while optimizing payload)
MAX_DIMENSION = 2048
MIN_DIMENSION = 64


class ImageProcessor:
    """Preprocesses and enhances images of mathematical equations for multimodal OCR."""

    @staticmethod
    def validate_image_payload(image_bytes: bytes, content_type: str = "") -> None:
        """Validates payload size and content type before loading into memory."""
        if not image_bytes:
            raise ValueError("Uploaded image is empty")

        if len(image_bytes) > MAX_IMAGE_FILE_SIZE:
            raise ValueError(
                f"Image size ({len(image_bytes) / (1024 * 1024):.1f} MB) exceeds maximum allowed limit of 10 MB"
            )

        if content_type and content_type.lower() not in ALLOWED_MIME_TYPES:
            raise ValueError(
                f"Unsupported image MIME type: '{content_type}'. Supported: {', '.join(sorted(ALLOWED_MIME_TYPES))}"
            )

    @staticmethod
    def optimize_image(
        image_bytes: bytes,
        enhance_contrast: bool = True,
        target_format: str = "PNG",
    ) -> Tuple[bytes, str, Tuple[int, int]]:
        """Cleans, normalizes orientation, enhances contrast, and resizes image.

        Returns:
            Tuple[bytes, str, Tuple[int, int]]: (optimized_bytes, mime_type, (width, height))
        """
        try:
            img = Image.open(io.BytesIO(image_bytes))
        except Exception as e:
            logger.warning("PIL failed to decode image: %s", e)
            raise ValueError("Invalid image file: Unable to decode image data")

        # Auto-rotate based on EXIF orientation if available
        try:
            img = ImageOps.exif_transpose(img)
        except Exception:
            pass

        # Convert palette/transparency to RGB on a clean white background
        if img.mode in ("RGBA", "LA", "P"):
            background = Image.new("RGB", img.size, (255, 255, 255))
            if img.mode == "P":
                img = img.convert("RGBA")
            background.paste(img, mask=img.split()[-1] if img.mode in ("RGBA", "LA") else None)
            img = background
        elif img.mode != "RGB":
            img = img.convert("RGB")

        orig_w, orig_h = img.size
        if orig_w < MIN_DIMENSION or orig_h < MIN_DIMENSION:
            raise ValueError(f"Image dimensions ({orig_w}x{orig_h}) are too small for OCR (minimum {MIN_DIMENSION}px)")

        # Scale down if either dimension exceeds MAX_DIMENSION, preserving aspect ratio
        if orig_w > MAX_DIMENSION or orig_h > MAX_DIMENSION:
            img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.Resampling.LANCZOS)

        # Contrast enhancement for handwritten equations
        if enhance_contrast:
            # Slight contrast boost (1.3x) to sharpen pencil/pen strokes against background
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(1.3)

        # Export to optimized in-memory buffer
        output_buffer = io.BytesIO()
        fmt = target_format.upper()
        if fmt == "JPEG" or fmt == "JPG":
            img.save(output_buffer, format="JPEG", quality=90, optimize=True)
            mime_type = "image/jpeg"
        else:
            img.save(output_buffer, format="PNG", optimize=True)
            mime_type = "image/png"

        final_bytes = output_buffer.getvalue()
        return final_bytes, mime_type, img.size


image_processor = ImageProcessor()
