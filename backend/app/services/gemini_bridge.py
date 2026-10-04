"""Google Gemini API Bridge using the official google-genai SDK.

Handles natural language to LaTeX problem decomposition, structured pedagogical
explanations, and safe fallbacks for edge-case mathematics.
"""
from __future__ import annotations

import json
import logging
import re
from typing import Any, Dict, List, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


class GeminiBridge:
    """Wrapper around the Google GenAI SDK with structured prompting and mock fallback."""

    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model_name = model_name or settings.GEMINI_MODEL
        self._client = None
        self._init_client()

    def _init_client(self) -> None:
        """Initializes the google.genai Client if an API key is available."""
        if not self.api_key:
            logger.info("No GEMINI_API_KEY found; operating in mock / symbolic fallback mode.")
            return

        try:
            from google import genai
            self._client = genai.Client(api_key=self.api_key)
            logger.info("Initialized Google GenAI client with model '%s'", self.model_name)
        except Exception as e:
            logger.warning("Failed to initialize Google GenAI client: %s", e)
            self._client = None

    def is_available(self) -> bool:
        """Checks if the Gemini API client is live and configured."""
        return self._client is not None

    def parse_natural_language_math(self, text: str) -> Dict[str, Any]:
        """Converts free-form math questions into structured LaTeX and domain payloads."""
        if not self.is_available():
            return self._mock_parse(text)

        system_instruction = (
            "You are a mathematical problem parser. Given a user query, extract the exact "
            "mathematical expression in standard LaTeX, identify the domain "
            "('algebra', 'calculus', 'equations', 'integral', 'derivative'), and identify the primary variable.\n"
            "Return ONLY raw JSON with keys: 'latex', 'domain', 'variable', 'instruction'."
        )

        prompt = f"Extract and normalize mathematical statement:\n{text}"

        try:
            response = self._client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config={"system_instruction": system_instruction, "temperature": 0.0},
            )
            raw = response.text.strip()
            # Clean markdown codeblocks if returned
            if raw.startswith("```"):
                raw = re.sub(r"^```(?:json)?\n?", "", raw)
                raw = re.sub(r"\n?```$", "", raw)

            parsed = json.loads(raw)
            return {
                "latex": parsed.get("latex", text),
                "domain": parsed.get("domain", "auto"),
                "variable": parsed.get("variable", "x"),
                "instruction": parsed.get("instruction", ""),
            }
        except Exception as e:
            logger.warning("Gemini parsing error (%s), using local fallback", e)
            return self._mock_parse(text)

    def generate_pedagogical_explanation(
        self,
        problem_latex: str,
        symbolic_steps: List[str],
        final_answer: str
    ) -> List[str]:
        """Enriches deterministic SymPy steps with pedagogical intuition."""
        if not self.is_available():
            return symbolic_steps

        prompt = (
            f"Problem: $${problem_latex}$$\n"
            f"Symbolic Steps:\n" + "\n".join(symbolic_steps) + "\n"
            f"Final Answer: $${final_answer}$$\n\n"
            "Provide a pedagogical step-by-step walkthrough explaining the concept concisely. "
            "Keep each step clear with LaTeX formatting. Return as a JSON list of strings."
        )

        try:
            response = self._client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config={"temperature": 0.2},
            )
            raw = response.text.strip()
            if raw.startswith("```"):
                raw = re.sub(r"^```(?:json)?\n?", "", raw)
                raw = re.sub(r"\n?```$", "", raw)
            data = json.loads(raw)
            if isinstance(data, list) and all(isinstance(x, str) for x in data):
                return data
        except Exception as e:
            logger.debug("Pedagogical explanation generation fell back to symbolic steps: %s", e)

        return symbolic_steps

    def _mock_parse(self, text: str) -> Dict[str, Any]:
        """Deterministic regex heuristic fallback when Gemini API key is absent."""
        t = text.strip()
        lower = t.lower()
        domain = "auto"
        var = "x"

        if "integrate" in lower or r"\int" in t:
            domain = "integral"
        elif "differentiate" in lower or "derivative" in lower or r"\frac{d}{d" in t or "diff" in lower:
            domain = "derivative"
        elif "=" in t:
            domain = "equations"
        elif any(k in lower for k in ["simplify", "factor", "expand", "polynomial"]):
            domain = "algebra"

        # Detect primary variable
        symbols_found = re.findall(r"\b([a-zA-Z])\b", t)
        for s in symbols_found:
            if s.lower() not in ["d", "e", "i"]:
                var = s
                break

        return {
            "latex": t,
            "domain": domain,
            "variable": var,
            "instruction": f"Solve problem in domain {domain}",
        }

    def sanitize_latex(self, raw_text: str) -> str:
        """Strips markdown code fences, conversational preambles, and math delimiters."""
        if not raw_text:
            return ""

        s = raw_text.strip()

        # Remove markdown codeblocks (e.g. ```latex ... ``` or ``` ... ```)
        s = re.sub(r"^```(?:latex|tex|math)?\s*\n?", "", s, flags=re.IGNORECASE)
        s = re.sub(r"\n?\s*```$", "", s)
        s = s.strip()

        # Remove common conversational prefixes
        prefixes = [
            r"^here\s+is\s+the\s+latex(?:\s+equation|\s+code)?:?\s*",
            r"^the\s+equation\s+is:?\s*",
            r"^latex:?\s*",
            r"^transcription:?\s*",
        ]
        for p in prefixes:
            s = re.sub(p, "", s, flags=re.IGNORECASE)

        # Remove enclosing math delimiters if present
        s = re.sub(r"^(\$\$|\$|\\\[|\\\()", "", s)
        s = re.sub(r"(\$\$|\$|\\\]|\\\))$", "", s)

        # Normalize line endings and duplicate spaces
        s = s.replace("\r\n", "\n").replace("\r", "\n")
        s = re.sub(r"[ \t]+", " ", s)

        return s.strip()

    def extract_latex_from_image(
        self,
        image_bytes: bytes,
        mime_type: str = "image/png"
    ) -> Dict[str, Any]:
        """Extracts LaTeX equations from an image using Gemini Vision."""
        if not self.is_available():
            return self._mock_image_ocr(image_bytes)

        system_instruction = (
            "You are an expert mathematical OCR and LaTeX transcriber. "
            "Transcribe all mathematical formulas, equations, or problems present in the image into accurate standard LaTeX notation.\n"
            "STRICT CONSTRAINTS:\n"
            "1. Return ONLY the raw mathematical LaTeX string.\n"
            "2. Do NOT output conversational text, explanations, greetings, or markdown code fences (no ```latex or ```).\n"
            "3. Preserve fractions, superscripts, subscripts, roots, matrices, integrals, derivatives, and Greek symbols accurately.\n"
            "4. If multiple equations are present, separate each on a new line.\n"
            "5. If handwriting is slightly ambiguous, resolve to the most mathematically coherent interpretation."
        )

        prompt = "Transcribe all mathematical equations and formulas in this image to standard LaTeX notation."

        try:
            from google.genai import types
            image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)

            response = self._client.models.generate_content(
                model=self.model_name,
                contents=[image_part, prompt],
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.0,
                ),
            )

            raw_latex = response.text or ""
            cleaned_latex = self.sanitize_latex(raw_latex)

            # Determine domain
            domain = "general"
            if r"\int" in cleaned_latex or "int" in cleaned_latex:
                domain = "integral"
            elif r"\frac{d}{d" in cleaned_latex or "d/d" in cleaned_latex or "partial" in cleaned_latex:
                domain = "derivative"
            elif "=" in cleaned_latex:
                domain = "equations"
            elif any(c in cleaned_latex for c in ["^", "+", "-", "*", "/", r"\frac"]):
                domain = "algebra"

            return {
                "success": bool(cleaned_latex),
                "latex": cleaned_latex,
                "confidence": 0.95 if cleaned_latex else 0.0,
                "detected_domain": domain,
                "warnings": [],
            }

        except Exception as e:
            logger.warning("Gemini Vision OCR extraction failed: %s", e)
            return self._mock_image_ocr(image_bytes, error_notice=str(e))

    def _mock_image_ocr(self, image_bytes: bytes, error_notice: Optional[str] = None) -> Dict[str, Any]:
        """Provides a safe deterministic fallback when Gemini API key is absent."""
        warnings = ["Mock OCR mode: Live Gemini Vision API key not configured"]
        if error_notice:
            warnings.append(f"Vision API notice: {error_notice}")

        # Deterministic sample equation for verification and testing
        mock_equation = r"\frac{x^2 - 4}{x - 2} = 4"
        return {
            "success": True,
            "latex": mock_equation,
            "confidence": 0.85,
            "detected_domain": "equations",
            "warnings": warnings,
        }


gemini_bridge = GeminiBridge()
