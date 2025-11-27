import type { VectorizeQueryResult } from './types';

/**
 * Generate a simple embedding from text using character-based vectorization
 * This is a basic implementation - in production you'd want to use a proper embedding model
 */
export function generateEmbedding(text: string, dimensions: number = 384): number[] {
  const normalized = text.toLowerCase().trim();
  const vector = new Array(dimensions).fill(0);
  
  // Create a deterministic vector based on character codes
  for (let i = 0; i < normalized.length; i++) {
    const charCode = normalized.charCodeAt(i);
    const index = (charCode * (i + 1)) % dimensions;
    vector[index] += Math.sin(charCode * (i + 1)) * 0.1;
  }
  
  // Normalize the vector
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return magnitude > 0 ? vector.map(v => v / magnitude) : vector;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }
  
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  
  return dotProduct / (magnitudeA * magnitudeB);
}

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
