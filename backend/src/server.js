import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { initDb } from './init.js';
import projects from './routes/projects.js';
import posts from './routes/posts.js';
import auth from './routes/auth.js';
import github from './routes/github.js';

// Fail fast: signing/verifying JWTs is impossible without this.
if (!process.env.JWT_SECRET) {
  throw new Error(
    'JWT_SECRET is not set. Add a long random string to backend/.env.',
  );
}

const app = express();

const origins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// credentials:true lets the browser send the httpOnly auth cookie. With
// origin:true the request's origin is reflected back — required, because you
// cannot combine the "*" wildcard with credentials.
app.use(cors({ origin: origins.length ? origins : true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Liveness check — handy for uptime monitors and deploy health checks.
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'e41c-api' });
});

app.use('/api/auth', auth);
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
