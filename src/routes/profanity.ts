import { Hono } from 'hono';
import type { Env, ProfanityCheckRequest } from '../types';
import { ProfanityService } from '../services/ProfanityService';

const profanity = new Hono<{ Bindings: Env }>();

profanity.post('/vector', async (c) => {
  try {
    const body = await c.req.json<ProfanityCheckRequest>();
    
    if (!body.text || typeof body.text !== 'string') {
      return c.json({ error: 'Text field is required and must be a string' }, 400);
    }

    if (body.text.length > 10000) {
      return c.json({ error: 'Text too long. Maximum 10000 characters' }, 400);
    }

    const threshold = body.threshold || 0.8;
    
    // Validate threshold
    if (threshold < 0 || threshold > 1) {
      return c.json({ error: 'Threshold must be between 0 and 1' }, 400);
    }

    // Initialize service and check profanity
    const service = new ProfanityService(c.env);
    const result = await service.checkProfanity(body.text, threshold);
    
    return c.json(result);
  } catch (error) {
    console.error('Error checking profanity:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default profanity;
