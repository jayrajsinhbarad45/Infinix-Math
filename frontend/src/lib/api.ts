/**
 * API client library connecting Next.js frontend to FastAPI backend.
 * Supports configurable backend URLs and on-device offline symbolic fallback.
 */
import { HealthResponse, OcrExtractResponse, SolveRequest, SolveResponse } from './types';
import { solveOfflineEquation } from './offlineSolver';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('infinix_backend_url');
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, '');
    }
  }
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return 'https://infinix-math-backend.onrender.com';
}

export function setApiBaseUrl(url: string): void {
  if (typeof window !== 'undefined') {
    const clean = url.trim().replace(/\/+$/, '');
    if (clean) {
      localStorage.setItem('infinix_backend_url', clean);
    } else {
      localStorage.removeItem('infinix_backend_url');
    }
  }
}

export async function solveMathProblem(request: SolveRequest): Promise<SolveResponse> {
  const baseUrl = getApiBaseUrl();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${baseUrl}/api/v1/solve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        problem_text: request.problem_text,
        domain: request.domain || 'auto',
        variable: request.variable || null,
      }),
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `Server responded with status ${res.status}`);
    }

    return await res.json();
  } catch (error: unknown) {
    // If backend is unreachable or timed out, attempt on-device symbolic fallback
    const offlineResult = solveOfflineEquation(request.problem_text);
    if (offlineResult) {
      return offlineResult;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Connection timed out contacting ${baseUrl}. Verify your backend is running.`);
      }
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error(
          `Cannot reach server at ${baseUrl}. If on a phone, configure your computer's Wi-Fi IP in Settings (e.g. http://10.114.172.74:8000).`
        );
      }
      throw error;
    }
    throw new Error('An unknown network error occurred while solving the problem');
  }
}

export async function extractMathOcr(imageFile: File | Blob, filename: string = 'equation.png'): Promise<OcrExtractResponse> {
  const baseUrl = getApiBaseUrl();
  try {
    const formData = new FormData();
    formData.append('file', imageFile, filename);

    const res = await fetch(`${baseUrl}/api/v1/ocr/extract?preprocess=true`, {
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
      if (error.message.includes('Failed to fetch')) {
        throw new Error(
          `Cannot reach OCR server at ${baseUrl}. Ensure backend is running and configure server URL in Settings.`
        );
      }
      throw error;
    }
    throw new Error('An unknown network error occurred during OCR transcription');
  }
}

export async function checkBackendHealth(): Promise<HealthResponse> {
  const baseUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/healthz`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`Health check returned status ${res.status}`);
    }
    return await res.json();
  } catch {
    return {
      status: 'offline',
      service: 'Infinix Math Backend',
      version: 'unknown',
      sympy_engine: 'offline',
      gemini_bridge: 'offline',
    };
  }
}

export async function verifyStudentStep(
  request: import('./types').StepVerificationRequest
): Promise<import('./types').StepVerificationResponse> {
  const baseUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/v1/tutor/verify-step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `Step verification failed with status ${res.status}`);
    }

    return await res.json();
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown network error occurred during step verification');
  }
}

export async function getTutorHint(
  request: import('./types').TutorHintRequest
): Promise<import('./types').TutorHintResponse> {
  const baseUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/v1/tutor/hint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `Failed to fetch hint with status ${res.status}`);
    }

    return await res.json();
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown network error occurred while generating hint');
  }
}

