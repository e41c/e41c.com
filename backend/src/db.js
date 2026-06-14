import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Copy backend/.env.example to backend/.env, ' +
      'and start Postgres with `npm run db:up`.',
  );
}

// A single shared connection pool for the whole process. The exact same code
// talks to local Docker Postgres and to Neon in production — only the
// DATABASE_URL and DATABASE_SSL env vars change between environments.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Thin helper so route files don't all import the pool directly.
export const query = (text, params) => pool.query(text, params);

export default pool;
