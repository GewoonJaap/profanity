/**
 * Utilities for fetching profanity word lists
 */

import type { ProfanitySource } from './config';
import type { WordsByLanguage } from './types';

/**
 * Fetch profanity words from a remote URL
 */
export async function fetchProfanityList(
  url: string,
  language: string
): Promise<string[]> {
  try {
    console.log(`🌐 Fetching ${language.toUpperCase()} list...`);
    const startTime = Date.now();
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const text = await response.text();

    // Split by newlines and filter empty lines
    const words = text
      .split('\n')
      .map((word) => word.trim().toLowerCase())
      .filter((word) => word.length > 0 && !word.startsWith('#')); // Filter comments

    const duration = Date.now() - startTime;
    console.log(`   ✓ ${words.length} words (${duration}ms)`);
    return words;
  } catch (error) {
    console.error(`   ✗ Error fetching ${language}:`, error);
    return [];
  }
}

/**
 * Fetch all profanity lists from sources
 */
export async function fetchAllLists(
  sources: ProfanitySource[]
): Promise<WordsByLanguage> {
  console.log(`\n📥 Fetching from ${sources.length} sources...\n`);
  const wordsByLanguage: WordsByLanguage = new Map();

  for (const source of sources) {
    const words = await fetchProfanityList(source.url, source.language);

    if (!wordsByLanguage.has(source.language)) {
      wordsByLanguage.set(source.language, new Set());
    }

    // Add to set to automatically deduplicate
    const languageSet = wordsByLanguage.get(source.language)!;
    const sizeBefore = languageSet.size;
    words.forEach((word) => languageSet.add(word));
    const sizeAfter = languageSet.size;
    const added = sizeAfter - sizeBefore;

    if (added > 0) {
      console.log(`   📝 Added ${added} new words to ${source.language}`);
    }
  }

  return wordsByLanguage;
}
