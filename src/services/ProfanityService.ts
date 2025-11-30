import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import type {
  Env,
  ProfanityCheckResult,
  ProfanityMatch,
  VectorizeQueryResult
} from '../types';
import {
  tokenizeText,
  isProfaneMatch 
} from '../vectorUtils';

const semanticSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 25,
  separators: [' '],
  chunkOverlap: 8,
});

export class ProfanityService {
  constructor(private env: Env) {}

  /**
   * Normalize text to prevent common circumvention techniques
   */
  private normalizeText(text: string): string {
    let normalized = text.toLowerCase();

    // Whitelist common words that might be flagged
    const whitelist = ['black', 'swear'];
    normalized = normalized
      .split(/\s/)
      .filter((word) => !whitelist.includes(word.toLowerCase()))
      .join(' ');

    // Remove common obfuscation characters
    normalized = normalized
      .replace(/[*@#$%&]+/g, '') // Remove special chars used for obfuscation
      .replace(/[0-9]/g, (match) => {
        // Leet speak conversion
        const leetMap: Record<string, string> = {
          '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b',
        };
        return leetMap[match] || match;
      })
      .replace(/(\w)\1{2,}/g, '$1') // Remove repeated characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    return normalized;
  }

  /**
   * Remove zero-width and invisible characters
   */
  private removeInvisibleCharacters(text: string): string {
    return text.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '');
  }

  /**
   * Generate variations of a word to catch obfuscation
   */
  private generateWordVariations(word: string): string[] {
    const variations = new Set<string>([word]);

    const withoutSpaces = word.replace(/\s/g, '');
    if (withoutSpaces !== word) variations.add(withoutSpaces);

    const withoutSubstitutions = word
      .replace(/[!|]/g, 'i')
      .replace(/\$/g, 's')
      .replace(/@/g, 'a')
      .replace(/\(/g, 'c');
    if (withoutSubstitutions !== word) variations.add(withoutSubstitutions);

    return Array.from(variations);
  }
  
  /**
   * Generates embeddings for an array of text chunks in batches.
   */
  private async embedChunks(chunks: string[]): Promise<Map<string, number[]>> {
    const embeddingsMap = new Map<string, number[]>();
    const AI_BATCH_SIZE = 100;

    for (let i = 0; i < chunks.length; i += AI_BATCH_SIZE) {
      const batch = chunks.slice(i, i + AI_BATCH_SIZE);
      const embeddingsResponse = await this.env.AI.run('@cf/google/embeddinggemma-300m', {
        text: batch,
      });

      if (!embeddingsResponse.data) {
        throw new Error('Failed to generate embeddings');
      }

      batch.forEach((chunk, j) => {
        embeddingsMap.set(chunk, embeddingsResponse.data[j]);
      });
    }
    return embeddingsMap;
  }

  /**
   * Check text for profanity with advanced detection and parallel processing
   */
  async checkProfanity(
    text: string,
    threshold: number = 0.86 // Adjusted based on competitor's code for better accuracy
  ): Promise<ProfanityCheckResult> {
    const cleanedText = this.removeInvisibleCharacters(text);
    const normalizedText = this.normalizeText(cleanedText);

    if (normalizedText.split(/\s/).length > 35 || normalizedText.length > 1000) {
        return {
            hasProfanity: false,
            matches: [],
            overallScore: 0,
            text: 'Due to temporary cloudflare limits, a message can only be up to 35 words or 1000 characters.',
        };
    }

    // --- 1. Collect all chunks to be checked ---
    const allChunks = new Set<string>();

    // Add spaced-out words
    const spacedOutWords = normalizedText.match(/\b(?:[a-zA-Z]\s)+[a-zA-Z]\b/g) || [];
    spacedOutWords.forEach(word => {
        allChunks.add(word.replace(/\s/g, ''));
    });

    const words = tokenizeText(normalizedText);
    const semanticChunks = await semanticSplitter.splitText(normalizedText);

    words.forEach(word => {
        if (word.length > 1) {
            this.generateWordVariations(word).forEach(v => allChunks.add(v));
        }
    });
    semanticChunks.forEach(chunk => allChunks.add(chunk));

    const uniqueChunks = Array.from(allChunks);
    if (uniqueChunks.length === 0) {
      return { hasProfanity: false, matches: [], overallScore: 0, text: cleanedText };
    }

    // --- 2. Generate embeddings for all chunks in parallel ---
    const embeddingsMap = await this.embedChunks(uniqueChunks);

    // --- 3. Query vector store for all chunks in parallel ---
    const queryPromises = uniqueChunks.map(chunk => {
      const embedding = embeddingsMap.get(chunk);
      if (!embedding) return Promise.resolve(null);

      return this.env.VECTORIZE.query(embedding, { topK: 1, returnMetadata: true })
        .then(res => ({ chunk, results: res.matches[0] }));
    });
    
    const queryResults = await Promise.all(queryPromises);

    // --- 4. Process results ---
    const profaneMatches: ProfanityMatch[] = [];
    queryResults.forEach(result => {
      if (result && result.results && isProfaneMatch(result.results, threshold)) {
        profaneMatches.push({
          word: result.chunk,
          matchScore: result.results.score,
          matchedProfanity: result.results.metadata?.word as string || 'unknown',
          isProfane: true,
        });
      }
    });

    const overallScore = profaneMatches.reduce((sum, m) => sum + m.matchScore, 0) / (words.length || 1);

    return {
      hasProfanity: profaneMatches.length > 0,
      matches: profaneMatches,
      overallScore,
      text: cleanedText,
    };
  }
}
