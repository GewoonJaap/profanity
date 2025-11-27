/**
 * Upload script that uses the Workers API for upsert
 * This prevents duplicates by updating existing vectors
 */

import fs from 'fs';
import { OUTPUT_FILE } from '../seed/config';

async function uploadVectors() {
  console.log('\n📤 Starting vector upload...');
  console.log('━'.repeat(60));

  // Read the generated vectors file
  if (!fs.existsSync(OUTPUT_FILE)) {
    console.error(`❌ Error: ${OUTPUT_FILE} not found. Run 'yarn seed' first.`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
  const vectors = data.vectors;

  console.log(`\n📦 Loaded ${vectors.length} vectors from ${OUTPUT_FILE}`);

  // Get worker URL and token from environment
  const workerUrl = process.env.WORKER_URL || 'http://localhost:8787/api/admin/upload-vectors';
  const uploadToken = process.env.UPLOAD_TOKEN;

  if (!uploadToken) {
    console.error('\n❌ Error: UPLOAD_TOKEN environment variable not set');
    console.log('\n💡 For local development, set it in .dev.vars:');
    console.log('   UPLOAD_TOKEN=your-secret-token-here\n');
    process.exit(1);
  }

  console.log(`\n🌐 Uploading to: ${workerUrl}\n`);

  const startTime = Date.now();

  try {
    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${uploadToken}`,
      },
      body: JSON.stringify({ vectors }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Upload failed: ${response.status} ${error}`);
    }

    const result = await response.json();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n' + '━'.repeat(60));
    console.log('\n✅ Upload Complete!');
    console.log(`   Vectors upserted: ${result.count}`);
    console.log(`   Total time: ${duration}s\n`);
  } catch (error) {
    console.error('\n❌ Upload failed:', error);
    console.log('\n💡 Make sure:');
    console.log('   1. The worker is running (yarn dev)');
    console.log('   2. UPLOAD_TOKEN is set in .dev.vars\n');
    process.exit(1);
  }
}

uploadVectors();
