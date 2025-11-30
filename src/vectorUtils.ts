import type { VectorizeQueryResult } from './types';

/**
 * Tokenize text into words
 */
export function tokenizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .split(/\s+/)
    .filter(word => word.length > 0);
}

/**
 * Check if a vector store result exceeds the threshold
 */
export function isProfaneMatch(result: VectorizeQueryResult, threshold: number): boolean {
  return result.score >= threshold;
}
