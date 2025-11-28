import { Hono } from 'hono';
import type { Env } from './types';
import profanity from './routes/profanity';
import admin from './routes/admin';

const app = new Hono<{ Bindings: Env }>();

app.get('/', (c) => {
  return c.json({
    message: 'Profanity Detection API',
    endpoints: {
      check: 'POST /api/profanity/vector',
      seed: 'POST /api/admin/words',
    },
  });
});

app.route('/api/profanity', profanity);
app.route('/api/admin', admin);

export default app;
