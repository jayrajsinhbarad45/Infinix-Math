# ♾️ Infinix Math

> **Next-Generation Interactive AI Math Solver & Tutor Engine**  
> *Deterministic symbolic mathematical precision meets multimodal pedagogical intelligence.*

Inspired by Mathos AI and the agentic architectural patterns of `ZelinZhou-THU/stem-tutor-agent`, **Infinix Math** couples Google Gemini multimodal vision and reasoning models with Python's deterministic SymPy symbolic computation engine to eliminate mathematical hallucinations.

---

## 🚀 Key Architectural Pillars

1. **Deterministic Symbolic Ground Truth:**
   - Decoupled symbolic algebra and calculus engine using Python SymPy.
   - Evaluates algebraic simplification, polynomial factorization, linear & non-linear equation systems, single & multivariable derivatives, and definite/indefinite integrals with timeout safety.
   - Symbolic and numerical zero-reduction equivalence checking ($\text{simplify}(a - b) = 0$).

2. **Multimodal OCR & LaTeX Pipeline:**
   - High-precision equation extraction from handwritten and printed math photos (PNG, JPEG, WebP).
   - Image optimization pipeline with orientation correction, RGBA alpha-flattening, and dynamic contrast boosting.
   - Specialized Gemini 2.5 Flash Vision system prompts enforcing clean LaTeX output without conversational chatter or code fences.

3. **Production FastAPI Backend:**
   - Async endpoints with Pydantic v2 validation and typed schema contracts.
   - Configurable safety limits (AST size bounds, ThreadPoolExecutor execution timeouts).
   - Health check probes (`/healthz` and `/api/v1/healthz`) for containerized deployment.

---

## 📁 Repository Structure

```
.
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── endpoints/
│   │   │       │   ├── health.py     # Liveness & readiness probes
│   │   │       │   ├── ocr.py        # POST /api/v1/ocr/extract
│   │   │       │   └── solve.py      # POST /api/v1/solve
│   │   │       └── router.py         # Route aggregation
│   │   ├── core/
│   │   │   ├── config.py             # Pydantic-settings configuration
│   │   │   └── logging.py            # Structured logging setup
│   │   ├── schemas/
│   │   │   └── math.py               # Pydantic request/response models
│   │   ├── services/
│   │   │   ├── gemini_bridge.py      # google-genai SDK multimodal bridge
│   │   │   ├── image_processor.py    # Image normalization & contrast pipeline
│   │   │   └── sympy_engine.py       # Deterministic SymPy solver & verifier
│   │   └── main.py                   # FastAPI application & CORS
│   ├── tests/
│   │   ├── test_api_ocr.py           # OCR endpoint integration tests
│   │   ├── test_api_solve.py         # Solver endpoint integration tests
│   │   ├── test_image_processor.py   # Image normalization unit tests
│   │   └── test_sympy_engine.py      # SymPy symbolic computation unit tests
│   ├── requirements.txt              # Pinned backend dependencies
│   ├── pyproject.toml                # Build system & pytest configuration
│   └── .env.example                  # Environment configuration template
├── pytest.ini                        # Monorepo pytest discovery
└── README.md
```

---

## 🛠️ Quickstart Guide

### Prerequisites
- Python 3.11+
- Virtual environment (`venv` or `conda`)

### 1. Setup Environment
```bash
# Clone the repository
git clone https://github.com/jayrajsinhbarad45/Infinix-Math.git
cd Infinix-Math

# Create and activate virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt
```

### 2. Configure Environment Variables
Copy `backend/.env.example` to `backend/.env`:
```bash
cp backend/.env.example backend/.env
```
Fill in your `GEMINI_API_KEY`:
```ini
GEMINI_API_KEY="your-google-gemini-api-key"
GEMINI_MODEL="gemini-2.5-flash"
SYMPY_TIMEOUT_SECONDS=4.0
```
*(Note: If `GEMINI_API_KEY` is not provided, the backend automatically runs in deterministic mock/offline mode for local testing).*

### 3. Run the Development Server
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- API Documentation: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
- Interactive Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/healthz](http://localhost:8000/healthz)

---

## 🧪 Running the Test Suite

Run the full automated test suite with pytest:
```bash
pytest backend/tests -v
```
All 51 unit and integration tests execute in <1s.

---

## 📋 API Endpoints

### 1. `POST /api/v1/solve`
Solves mathematical problems with deterministic symbolic verification.
- **Request Body:**
  ```json
  {
    "problem_text": "\\int_{0}^{1} (4x^3 + 3x^2) dx",
    "domain": "integral"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "latex_solution": "2",
    "steps": [
      "Integrand: $$f(x) = 4 x^{3} + 3 x^{2}$$",
      "Definite Integral Bounds: $$[0, 1]$$",
      "Antiderivative $$F(x) = x^{4} + x^{3}$$",
      "Evaluate Fundamental Theorem of Calculus $$F(1) - F(0)$$",
      "Final Definite Value: $$2$$"
    ],
    "is_symbolically_verified": true,
    "domain": "calculus",
    "execution_time_ms": 58.2
  }
  ```

### 2. `POST /api/v1/ocr/extract`
Uploads an image containing printed or handwritten equations and extracts sanitized LaTeX.
- **Request Form:** Multipart form upload (`file` parameter, JPEG/PNG/WebP).
- **Response:**
  ```json
  {
    "success": true,
    "latex": "\\frac{x^2 - 4}{x - 2} = 4",
    "confidence": 0.95,
    "detected_domain": "equations",
    "execution_time_ms": 112.4
  }
  ```

---

## 🗺️ Roadmap & Phases

- [x] **Phase 1:** Core Solver & Symbolic Engine (FastAPI + SymPy + Google GenAI Bridge)
- [x] **Phase 2:** Multimodal OCR & LaTeX Extraction (Image normalization + Gemini Vision)
- [ ] **Phase 3:** Interactive Frontend & KaTeX Math Rendering (Next.js + Tailwind CSS)
- [ ] **Phase 4:** Step Verification & AI Tutor Mode (Catching student mistakes live)
- [ ] **Phase 5:** CI/CD Automation & Cloud Deployment (Docker + Cloud Run / Vercel)
