# e41c.com

Personal site & portfolio of **Eric Grigor** — software engineer.

An Apple-inspired, fullstack web app. Vite + React frontend, Node/Express + Postgres backend, kept in separate workspaces so the frontend/backend boundary is explicit.

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
│       ├── seed.js      your projects — EDIT THIS
│       └── routes/      projects.js, github.js
├── docker-compose.yml # local Postgres (+ optional API container)
└── package.json       # npm workspaces — runs both with one command
```

## Getting started

Requires **Node 22+** and **Docker** (for the local Postgres).

```bash
npm install                         # installs both workspaces
cp backend/.env.example backend/.env   # default values work for local dev
npm run db:up                       # start Postgres in Docker
npm run seed                        # create tables + seed projects
npm run dev                         # run API (:4000) and web (:5173) together
```

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
- [ ] Blog (write/publish, stored in Postgres)
- [ ] Client signup + job requests
- [ ] MT5 algo-trading dashboard (equity curve, win rate, live positions)
- [ ] Résumé / `/uses` page
