import 'dotenv/config';
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
  console.log(`✓ Seeded ${projects.length} projects into Postgres.`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
