/**
 * TypeScript interfaces for Infinix Math frontend.
 */

export type MathDomain =
  | 'algebra'
  | 'equations'
  | 'calculus'
  | 'derivative'
  | 'integral'
  | 'general'
  | 'auto';

export interface MathStep {
  step_number: number;
  description: string;
  latex: string;
  rule?: string;
  is_symbolically_verified: boolean;
}

export interface SolveRequest {
  problem_text: string;
  domain?: MathDomain;
  variable?: string;
}

export interface SolveResponse {
  success: boolean;
  latex_solution: string;
  steps: string[];
  is_symbolically_verified: boolean;
  domain: string;
  structured_steps: MathStep[];
  execution_time_ms: number;
  error?: string;
}

export interface OcrExtractResponse {
  success: boolean;
  latex: string;
  confidence: number;
  detected_domain: string;
  warnings: string[];
  execution_time_ms: number;
  image_dimensions?: [number, number];
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  sympy_engine: string;
  gemini_bridge: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  problem_text: string;
  domain: string;
  solution_latex: string;
  is_symbolically_verified: boolean;
  steps_count: number;
}
