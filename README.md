# e41c.com

Personal site & portfolio of **Eric Grigor** — software engineer.

An Apple-inspired, fullstack web app. Vite + React frontend, Node/Express + Postgres backend, kept in separate workspaces so the frontend/backend boundary is explicit.

> **New here?** [`ARCHITECTURE.md`](./ARCHITECTURE.md) walks through how it all fits together with concrete request flows.

## Stack

| Layer    | Tech                                            |
| -------- | ----------------------------------------------- |
| Frontend | React, Vite, React Router, Framer Motion        |
| Backend  | Node.js, Express, `pg` (node-postgres)          |
| Database | PostgreSQL — Docker locally, Neon in production  |
| Infra    | Docker Compose (local), Vercel + container host |

## Project layout

```
e41cDotCom/
├── frontend/          # Vite + React SPA (the site)
├── backend/           # Express API + Postgres
│   ├── Dockerfile     #   container image for deploy
│   └── src/
│       ├── server.js    app entry (CORS, routes, error handler)
│       ├── db.js        Postgres connection pool
│       ├── schema.sql   table definitions (idempotent)
│       ├── init.js      applies the schema on boot
│       ├── seed.js      your projects + a welcome post — EDIT THIS
│       └── routes/      projects.js, posts.js, github.js
├── docker-compose.yml # local Postgres (+ optional API container)
└── package.json       # npm workspaces — runs both with one command
```

## Getting started

Requires **Node 22+** and **Docker** (for the local Postgres).

```bash
npm install                         # installs both workspaces
cp backend/.env.example backend/.env   # then set JWT_SECRET + ADMIN_PASSWORD
npm run db:up                       # start Postgres in Docker
npm run seed                        # create tables, seed content + admin user
npm run dev                         # run API (:4000) and web (:5173) together
```

> Set `JWT_SECRET` in `backend/.env` before starting (the API won't boot
> without it) — e.g. `openssl rand -hex 32`. Set `ADMIN_PASSWORD` too; that's
> your login for `/admin`.

Then open http://localhost:5173. The Vite dev server proxies `/api/*` to the backend, so there are no CORS headaches in development.

## How the database works

- **Local:** Postgres runs in a Docker container (`npm run db:up`). Data persists in a named volume between restarts; `npm run db:reset` wipes it.
- **Production:** a managed [Neon](https://neon.tech) Postgres. Nothing in the code changes — you only point `DATABASE_URL` at Neon and set `DATABASE_SSL=true`.

## Running the backend in Docker too (optional)

```bash
docker compose --profile full up    # Postgres + the API container together
```

This mirrors how the backend runs in production. Day to day, running the API
with `npm run dev` is faster (hot reload), so the API container is opt-in.

## Useful commands

| Command            | What it does                                   |
| ------------------ | ---------------------------------------------- |
| `npm run dev`      | Run frontend + backend together                |
| `npm run dev:web`  | Frontend only                                  |
| `npm run dev:api`  | Backend only                                   |
| `npm run seed`     | Apply schema + (re)seed the projects table     |
| `npm run db:up`    | Start the local Postgres container             |
| `npm run db:down`  | Stop it (data kept)                            |
| `npm run db:reset` | Stop and **wipe** the local database, restart  |
| `npm run build`    | Production build of the frontend               |

## Accounts & roles

Auth is a JWT stored in an httpOnly cookie, with two roles plus anonymous guests:

| Role    | Who                                | Can                                  |
| ------- | ---------------------------------- | ------------------------------------ |
| guest   | not signed in                      | read public pages                    |
| `user`  | anyone who signs up at `/signup`   | account actions (e.g. request work)  |
| `admin` | seeded server-side (`npm run seed`)| publish/edit/delete blog posts       |

Endpoints: `POST /api/auth/signup`, `/login`, `/logout`, `GET /api/auth/me`.
Two middlewares enforce it — `authenticate` (identity) and `requireRole(...)`
(permission). See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full flow.

The admin login comes from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `backend/.env`.

## Writing (blog)

Posts live in the `posts` table as Markdown. Reading is public; publishing
requires an **admin** account.

- **Read:** `GET /api/posts` (published list) and `GET /api/posts/:slug`.
- **Publish:** sign in as the admin, go to `/admin` (not linked in the nav),
  write Markdown, publish. Under the hood: `POST /api/posts`, gated by
  `requireRole('admin')`.
- Drafts (`published = false`) stay invisible to the public API until published.

## Deployment

- **Frontend → Vercel.** Set the project root to `frontend/`, build command
  `npm run build`, output `dist/`. Add an env var `VITE_API_URL` pointing at the
  deployed API (e.g. `https://e41c-api.up.railway.app/api`).
- **Backend → a container host** (Railway / Render / Fly) built from
  `backend/Dockerfile`. Set `DATABASE_URL` (Neon), `DATABASE_SSL=true`, and
  `CORS_ORIGIN=https://e41c.com`.
- **Database → Neon.** Create a project, copy the connection string.

## Roadmap

- [x] v1 — Polished landing + projects showcase (API-driven)
- [x] Postgres + Docker + deploy-ready config
- [x] Blog — Markdown posts with token-gated publishing (`/admin`)
- [ ] Client signup + job requests
- [ ] MT5 algo-trading dashboard (equity curve, win rate, live positions)
- [ ] Résumé / `/uses` page
