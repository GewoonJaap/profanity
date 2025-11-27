import { Hono } from 'hono';
import type { Env } from './types';
import profanity from './routes/profanity';

const app = new Hono<{ Bindings: Env }>();

app.get('/', (c) => {
  return c.json({
    message: 'Profanity Detection API',
    endpoints: {
      check: 'POST /api/profanity/vector',
    },
  });
});

app.route('/api/profanity', profanity);

export default app;
