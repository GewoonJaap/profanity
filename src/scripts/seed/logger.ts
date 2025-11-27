/**
 * Logging utilities for seed script
 */

import type { WordsByLanguage } from './types';

/**
 * Print summary statistics
 */
export function printSummary(wordsByLanguage: WordsByLanguage): number {
  let totalWords = 0;
  console.log('\n' + '━'.repeat(60));
  console.log('\n📊 Summary by Language:');
  console.log('━'.repeat(60));

  const languageStats = Array.from(wordsByLanguage.entries()).sort(
    (a, b) => b[1].size - a[1].size
  );

  for (const [language, words] of languageStats) {
    const bar = '█'.repeat(Math.floor(words.size / 50));
    console.log(
      `  ${language.padEnd(4)} ${words.size.toString().padStart(5)} words ${bar}`
    );
    totalWords += words.size;
  }
  console.log('━'.repeat(60));
  console.log(
    `  Total: ${totalWords} unique words across ${wordsByLanguage.size} languages\n`
  );

  return totalWords;
}

/**
 * Print completion summary
 */
export function printCompletion(
  totalDuration: number,
  vectorCount: number,
  outputFile: string
): void {
  console.log('\n' + '━'.repeat(60));
  console.log('\n✅ Seeding Complete!');
  console.log(`   Total time: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`   Vectors: ${vectorCount}`);
  console.log(`   File: ${outputFile}\n`);
}
