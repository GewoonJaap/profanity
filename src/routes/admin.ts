import { Hono } from 'hono';
import type { Env } from '../types';

const admin = new Hono<{ Bindings: Env }>();

// Middleware for token authentication
const authMiddleware = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: Missing or invalid token' }, 401);
  }

  const token = authHeader.substring(7); // Remove 'Bearer '
  if (token !== c.env.UPLOAD_TOKEN) {
    return c.json({ error: 'Unauthorized: Invalid token' }, 401);
  }

  await next();
};

// Apply middleware to all routes in this router
admin.use('/*', authMiddleware);

admin.post('/words', async (c) => {
  try {
    const body = await c.req.json<{ words: string[] }>();

    if (!body.words || !Array.isArray(body.words)) {
      return c.json({ error: '`words` field is required and must be an array of strings' }, 400);
    }
    
    const uniqueWords = [...new Set(body.words)];

    if (uniqueWords.length === 0) {
        return c.json({ message: 'No words provided, nothing to do.' });
    }

    const AI_BATCH_SIZE = 100;
    const allVectors = [];

    for (let i = 0; i < uniqueWords.length; i += AI_BATCH_SIZE) {
      const batchWords = uniqueWords.slice(i, i + AI_BATCH_SIZE);
      
      const embeddingsResponse = await c.env.AI.run('@cf/baai/bge-small-en-v1.5', {
        text: batchWords,
      });

      if (!embeddingsResponse.data) {
          throw new Error('Failed to generate embeddings');
      }

      const vectors = batchWords.map((word, j) => ({
        id: `profanity-${word.replace(/\s/g, '-')}`, // Create a deterministic ID
        values: embeddingsResponse.data[j],
        metadata: {
          word: word,
          category: 'profanity',
        },
      }));
      allVectors.push(...vectors);
    }

    // Upsert vectors into the index in batches
    const VECTORIZE_BATCH_SIZE = 1000;
    let totalUpserted = 0;

    for (let i = 0; i < allVectors.length; i += VECTORIZE_BATCH_SIZE) {
        const batch = allVectors.slice(i, i + VECTORIZE_BATCH_SIZE);
        const result = await c.env.VECTORIZE.upsert(batch);
        totalUpserted += result.count;
    }

    return c.json({
      message: `Successfully seeded ${totalUpserted} words.`,
      count: totalUpserted,
    });
  } catch (error) {
    console.error('Error seeding words:', error);
    return c.json({ error: 'Internal server error while seeding words' }, 500);
  }
});

export default admin;
