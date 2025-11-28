import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import profanity from './routes/profanity';
import admin from './routes/admin';

const app = new Hono<{ Bindings: Env }>();

// Add CORS middleware
app.use('/api/*', cors({
  origin: 'profanity.christmas-tree.app',
}));

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
