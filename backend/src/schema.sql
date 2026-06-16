-- Schema is idempotent (IF NOT EXISTS), so it is safe to run on every server
-- boot and before every seed. A fresh deploy gets its tables automatically.

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,                       -- bcrypt hash, never plaintext
  role          TEXT NOT NULL DEFAULT 'user'
                  CHECK (role IN ('user', 'admin')), -- guest = no account at all
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS posts (
  id           SERIAL PRIMARY KEY,
  slug         TEXT UNIQUE NOT NULL,
  title        TEXT NOT NULL,
  excerpt      TEXT NOT NULL DEFAULT '',
  body         TEXT NOT NULL,            -- Markdown
  tags         JSONB NOT NULL DEFAULT '[]'::jsonb,
  published    BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,              -- set when first published
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
