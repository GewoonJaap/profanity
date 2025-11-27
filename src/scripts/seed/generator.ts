/**
 * Vector generation utilities
 */

import { generateEmbedding } from '../../vectorUtils';
import type { VectorRecord, WordsByLanguage } from './types';

/**
 * Generate vector records with deduplication
 */
export function generateVectorRecords(
  wordsByLanguage: WordsByLanguage
): VectorRecord[] {
  const records: VectorRecord[] = [];
  let index = 0;

  for (const [language, words] of wordsByLanguage.entries()) {
    for (const word of words) {
      records.push({
        id: `profanity-${language}-${index}`,
        values: generateEmbedding(word),
        metadata: {
          word,
          category: 'profanity',
          language,
        },
      });
      index++;
    }
  }

  return records;
}
