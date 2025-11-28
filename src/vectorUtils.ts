import type { VectorizeQueryResult, Env } from './types';

/**
 * Generate an embedding from text using a proper embedding model
 */
export async function generateEmbedding(text: string, ai: Env['AI']): Promise<number[]> {
  if (!text) {
    // Return a zero-vector for empty strings
    return new Array(384).fill(0);
  }
  const embeddingsResponse = await ai.run('@cf/baai/bge-small-en-v1.5', {
    text: [text],
  });

  if (!embeddingsResponse.data || embeddingsResponse.data.length === 0) {
      throw new Error('Failed to generate embeddings');
  }

  return embeddingsResponse.data[0];
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
