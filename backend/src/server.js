import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { initDb } from './init.js';
import projects from './routes/projects.js';
import posts from './routes/posts.js';
import github from './routes/github.js';

const app = express();

// In production, lock CORS to your real frontend origin(s) via CORS_ORIGIN
// (comma-separated, e.g. "https://e41c.com,https://www.e41c.com"). In dev it's
// unset → allow all, so the Vite proxy and direct calls both work.
const origins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(cors({ origin: origins.length ? origins : true }));
app.use(express.json());

// Liveness check — handy for uptime monitors and deploy health checks.
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'e41c-api' });
});

app.use('/api/projects', projects);
app.use('/api/posts', posts);
app.use('/api/github', github);

// Central error handler — keeps route code tidy (routes just call next(err)).
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;

// Ensure tables exist, then start listening.
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🧙  e41c API listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize the database:', err);
    process.exit(1);
  });
