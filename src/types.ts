export interface ProfanityMatch {
  word: string;
  matchScore: number;
  matchedProfanity: string;
  isProfane: boolean;
}

export interface ProfanityCheckResult {
  hasProfanity: boolean;
  matches: ProfanityMatch[];
  overallScore: number;
  text: string;
}

export interface ProfanityCheckRequest {
  text: string;
  threshold?: number; // Default 0.8 (80% match)
}

export interface Env {
  VECTORIZE: Vectorize;
  UPLOAD_TOKEN?: string;
}

export interface VectorizeVector {
  id: string;
  values: number[];
  metadata?: Record<string, any>;
}

export interface VectorizeQueryResult {
  id: string;
  score: number;
  metadata?: Record<string, any>;
}
