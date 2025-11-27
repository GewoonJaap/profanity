/**
 * Main seeding script
 * Orchestrates fetching, generating, and writing vector data
 * 
 * Run with: yarn seed
 * Upload with: yarn seed:upload
 */

import fs from 'fs';
import { PROFANITY_SOURCES, OUTPUT_FILE } from './config';
import { fetchAllLists } from './fetcher';
import { generateVectorRecords } from './generator';
import { printSummary, printCompletion } from './logger';

async function main() {
  console.log('\n🌱 Starting profanity vector seeding...');
  console.log('━'.repeat(60));

  const totalStartTime = Date.now();

  // Step 1: Fetch all profanity lists
  const wordsByLanguage = await fetchAllLists(PROFANITY_SOURCES);

  // Step 2: Print summary statistics
  const totalWords = printSummary(wordsByLanguage);

  // Step 3: Generate vectors
  console.log('🔢 Generating embeddings...');
  const embeddingStartTime = Date.now();
  const vectors = generateVectorRecords(wordsByLanguage);
  const embeddingDuration = Date.now() - embeddingStartTime;
  console.log(`   ✓ Generated ${vectors.length} vectors (${embeddingDuration}ms)\n`);

  // Step 4: Write to JSON file
  console.log('💾 Writing to file...');
  const writeStartTime = Date.now();
  const output = { vectors };
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  const writeDuration = Date.now() - writeStartTime;
  const fileSize = (fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2);
  console.log(`   ✓ Saved ${OUTPUT_FILE} (${fileSize}MB, ${writeDuration}ms)`);

  // Step 5: Print completion summary
  const totalDuration = Date.now() - totalStartTime;
  printCompletion(totalDuration, vectors.length, OUTPUT_FILE);
}

// Run the seeding
main().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
