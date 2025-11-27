import { Hono } from 'hono';
import type { Env } from './types';
import profanity from './routes/profanity';

const app = new Hono<{ Bindings: Env }>();

app.get('/', (c) => {
  return c.json({
    message: 'Profanity Detection API',
    endpoints: {
      check: 'POST /api/profanity/vector',
      upload: 'POST /api/admin/upload-vectors',
    },
  });
});

app.route('/api/profanity', profanity);

// Admin endpoint for uploading/upserting vectors
app.post('/api/admin/upload-vectors', async (c) => {
  try {
    // Check authentication
    const authHeader = c.req.header('Authorization');
    const expectedToken = c.env.UPLOAD_TOKEN;

    if (!expectedToken) {
      return c.json({ error: 'Upload endpoint not configured' }, 503);
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized: Bearer token required' }, 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (token !== expectedToken) {
      return c.json({ error: 'Unauthorized: Invalid token' }, 401);
    }

    const { vectors } = await c.req.json<{ vectors: any[] }>();

    if (!vectors || !Array.isArray(vectors)) {
      return c.json({ error: 'Invalid request: vectors array required' }, 400);
    }

    console.log(`📤 Upserting ${vectors.length} vectors...`);

    // Process in batches to avoid timeouts
    const BATCH_SIZE = 1000;
    let totalUpserted = 0;

    for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
      const batch = vectors.slice(i, i + BATCH_SIZE);
      const result = await c.env.VECTORIZE.upsert(batch);
      totalUpserted += result.count;
      console.log(`   ✓ Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${result.count} vectors`);
    }

    return c.json({
      success: true,
      count: totalUpserted,
      message: `Successfully upserted ${totalUpserted} vectors`,
    });
  } catch (error) {
    console.error('Error upserting vectors:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

export default app;
