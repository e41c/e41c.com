-- Schema is idempotent (IF NOT EXISTS), so it is safe to run on every server
-- boot and before every seed. A fresh deploy gets its tables automatically.
CREATE TABLE IF NOT EXISTS projects (
  id          SERIAL PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  title       TEXT NOT NULL,
  tagline     TEXT NOT NULL,
  description TEXT NOT NULL,
  tech        JSONB NOT NULL,            -- array of strings, e.g. ["React","Vite"]
  repo_url    TEXT,
  live_url    TEXT,
  featured    BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
