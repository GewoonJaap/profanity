/**
 * Helper script to fetch profanity lists and generate a JSON payload for the seeding endpoint.
 * 
 * Run with: yarn prepare-seed
 */

import fs from 'fs';
import { PROFANITY_SOURCES, OUTPUT_FILE } from './config';

async function fetchProfanityList(url: string, language: string): Promise<string[]> {
  try {
    console.log(`🌐 Fetching ${language.toUpperCase()} list from ${url}...`);
    const startTime = Date.now();
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const text = await response.text();

    const words = text
      .split('\n')
      .map((word) => word.trim().toLowerCase())
      .filter((word) => word.length > 0 && !word.startsWith('#'));

    const duration = Date.now() - startTime;
    console.log(`   ✓ Found ${words.length} words (${duration}ms)`);
    return words;
  } catch (error) {
    console.error(`   ✗ Error fetching ${language} list:`, error);
    return [];
  }
}

async function main() {
  console.log('\n🌱 Preparing seed data...');
  console.log('━'.repeat(60));

  let allWords = new Set<string>();

  for (const source of PROFANITY_SOURCES) {
    const words = await fetchProfanityList(source.url, source.language);
    words.forEach(word => allWords.add(word));
  }
  
  const uniqueWords = [...allWords];

  console.log(`\nTotal unique words fetched: ${uniqueWords.length}`);

  console.log(`\n💾 Writing to ${OUTPUT_FILE}...`);
  const output = { words: uniqueWords };
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

  const fileSize = (fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2);
  console.log(`   ✓ Saved ${OUTPUT_FILE} (${fileSize}KB)`);
  
  console.log('\n' + '━'.repeat(60));
  console.log('✅ Seed data preparation complete!');
  console.log(`\nNow you can use this file to seed the database using the API endpoint.`);
  console.log(`Example using curl:`);
  console.log(`curl -X POST http://localhost:8787/api/admin/words -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_UPLOAD_TOKEN" --data-binary "@${OUTPUT_FILE}"`);
  console.log('\n');
}

main().catch((error) => {
  console.error('\n❌ Data preparation failed:', error);
  process.exit(1);
});
