/**
 * API client library connecting Next.js frontend to FastAPI backend.
 */
import { HealthResponse, OcrExtractResponse, SolveRequest, SolveResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function solveMathProblem(request: SolveRequest): Promise<SolveResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/solve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        problem_text: request.problem_text,
        domain: request.domain || 'auto',
        variable: request.variable || null,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `Server responded with status ${res.status}`);
    }

    return await res.json();
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown network error occurred while solving the problem');
  }
}

export async function extractMathOcr(imageFile: File | Blob, filename: string = 'equation.png'): Promise<OcrExtractResponse> {
  try {
    const formData = new FormData();
    formData.append('file', imageFile, filename);

    const res = await fetch(`${API_BASE_URL}/api/v1/ocr/extract?preprocess=true`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `OCR failed with status ${res.status}`);
    }

    return await res.json();
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown network error occurred during OCR transcription');
  }
}

export async function checkBackendHealth(): Promise<HealthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/healthz`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`Health check returned status ${res.status}`);
    }
    return await res.json();
  } catch (error: unknown) {
    return {
      status: 'offline',
      service: 'Infinix Math Backend',
      version: 'unknown',
      sympy_engine: 'offline',
      gemini_bridge: 'offline',
    };
  }
}
