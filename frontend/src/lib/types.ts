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

export type StepVerificationStatus = 'correct' | 'incorrect_math' | 'incomplete' | 'unclear';

export interface StepVerificationRequest {
  problem: string;
  previous_steps: string[];
  proposed_step: string;
  variable?: string;
}

export interface StepVerificationResponse {
  is_valid: boolean;
  status: StepVerificationStatus;
  confidence: number;
  evidence: string;
  error_code?: string;
  suggested_correction?: string;
  pedagogical_hint?: string;
  is_symbolically_verified: boolean;
  is_final_step: boolean;
  execution_time_ms: number;
}

export interface TutorHintRequest {
  problem: string;
  current_steps: string[];
}

export interface TutorHintResponse {
  hint: string;
  suggested_technique?: string;
}

