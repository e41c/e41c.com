import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pool from './db.js';
import { initDb } from './init.js';

// Edit this list freely — re-running `npm run seed` upserts by slug, so you
// won't get duplicates and existing rows get updated in place.
const projects = [
  {
    slug: 'e41c-com',
    title: 'e41c.com',
    tagline: 'This site — an Apple-inspired fullstack portfolio.',
    description:
      'A personal site built from scratch: Vite + React frontend, Node/Express + Postgres backend, kept in separate workspaces. Buttery scroll animations, a tight type system, and an API-driven projects showcase you are looking at right now. Deployed with the frontend on Vercel and the API in a Docker container.',
    tech: ['React', 'Vite', 'Node.js', 'Express', 'Postgres', 'Docker'],
    repo_url: 'https://github.com/e41c/e41cDotCom',
    live_url: 'https://e41c.com',
    featured: true,
    sort_order: 1,
  },
  {
    slug: 'mt5-algo-bot',
    title: 'MT5 Algo Trading Bot',
    tagline: 'Automated trading strategy for MetaTrader 5.',
    description:
      'An algorithmic trading bot for MetaTrader 5 that executes a rules-based strategy with backtesting, risk management, and live position monitoring. Designed to surface its own performance — equity curve, win rate, and drawdown — so the results speak for themselves.',
    tech: ['Python', 'MetaTrader 5', 'Pandas', 'Backtesting'],
    repo_url: '',
    live_url: '',
    featured: true,
    sort_order: 2,
  },
  {
    slug: 'sample-project',
    title: 'Your Next Project',
    tagline: 'Swap this out for something you are proud of.',
    description:
      'Placeholder card. Edit backend/src/seed.js to add your real projects — title, tagline, description, tech stack, GitHub repo, and live URL — then run `npm run seed` again.',
    tech: ['Edit me', 'in seed.js'],
    repo_url: '',
    live_url: '',
    featured: false,
    sort_order: 3,
  },
];

// One published post so the blog isn't empty. Add more via the /admin editor.
const posts = [
  {
    slug: 'hello-world',
    title: 'Building this site from scratch',
    excerpt:
      'Why I built my portfolio as a real fullstack app instead of a template — and what I learned wiring up React, Express, Postgres, and Docker.',
    tags: ['web-dev', 'react', 'postgres'],
    published: true,
    body: `# Building this site from scratch

I could have grabbed a template. Instead I built **e41c.com** as a real
fullstack application — because the point is to *show* I can build one.

## The stack

- **Frontend** — React + Vite, with Framer Motion for the animations.
- **Backend** — Node and Express, split into its own workspace.
- **Database** — Postgres, running in Docker locally and on Neon in production.

\`\`\`js
// The whole app talks to one tiny helper:
const BASE = import.meta.env.VITE_API_URL || '/api';
export const fetchPosts = () => getJSON('/posts');
\`\`\`

## What's next

A live dashboard for my MetaTrader 5 trading bot, a way for clients to request
work, and more writing. Thanks for reading — more soon.`,
  },
];

const upsertPost = `
  INSERT INTO posts (slug, title, excerpt, body, tags, published, published_at)
  VALUES ($1, $2, $3, $4, $5::jsonb, $6, CASE WHEN $6 THEN now() ELSE NULL END)
  ON CONFLICT (slug) DO UPDATE SET
    title     = EXCLUDED.title,
    excerpt   = EXCLUDED.excerpt,
    body      = EXCLUDED.body,
    tags      = EXCLUDED.tags,
    published = EXCLUDED.published;
`;

const upsert = `
  INSERT INTO projects
    (slug, title, tagline, description, tech, repo_url, live_url, featured, sort_order)
  VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  ON CONFLICT (slug) DO UPDATE SET
    title       = EXCLUDED.title,
    tagline     = EXCLUDED.tagline,
    description = EXCLUDED.description,
    tech        = EXCLUDED.tech,
    repo_url    = EXCLUDED.repo_url,
    live_url    = EXCLUDED.live_url,
    featured    = EXCLUDED.featured,
    sort_order  = EXCLUDED.sort_order;
`;

async function main() {
  await initDb();
  for (const p of projects) {
    await pool.query(upsert, [
      p.slug,
      p.title,
      p.tagline,
      p.description,
      JSON.stringify(p.tech), // text param → cast into the JSONB column
      p.repo_url,
      p.live_url,
      p.featured,
      p.sort_order,
    ]);
  }
  for (const p of posts) {
    await pool.query(upsertPost, [
      p.slug,
      p.title,
      p.excerpt,
      p.body,
      JSON.stringify(p.tags),
      p.published,
    ]);
  }
  // Seed (or reset) the single admin account from env. Signups via the API are
  // always 'user'; the admin only exists because we create it here, server-side.
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@e41c.com').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'change-me-please';
  const adminHash = await bcrypt.hash(adminPassword, 10);
  await pool.query(
    `INSERT INTO users (email, name, password_hash, role)
     VALUES ($1, 'Eric Grigor', $2, 'admin')
     ON CONFLICT (email) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       role          = 'admin'`,
    [adminEmail, adminHash],
  );

  console.log(
    `✓ Seeded ${projects.length} projects and ${posts.length} post(s) into Postgres.`,
  );
  console.log(`✓ Admin account ready: ${adminEmail}`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
