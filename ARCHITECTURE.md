# Architecture & data flow

A short tour of how e41c.com is wired together — the mental model behind the
code, with concrete request walkthroughs.

## Big picture

The app is a **monorepo with two independent workspaces** that only ever talk
to each other over HTTP/JSON. Neither imports the other's code.

```
┌──────────────────────────┐         HTTP /api/*          ┌──────────────────────────┐
│        frontend/         │  ───────────────────────▶    │         backend/         │
│  React + Vite SPA        │   (JSON over fetch)          │  Node + Express          │
│  - pages/ (routes)       │  ◀───────────────────────    │  - routes/ (endpoints)   │
│  - components/ (UI)      │         JSON responses       │  - db.js (pg Pool)       │
│  - lib/api.js (fetch)    │                              │  - schema.sql (tables)   │
└──────────────────────────┘                              └─────────────┬────────────┘
                                                                         │ SQL
                                                                         ▼
                                                              ┌────────────────────┐
                                                              │   PostgreSQL       │
                                                              │  Docker (local) /  │
                                                              │  Neon (production) │
                                                              └────────────────────┘
```

**Why split this way?** It mirrors how real teams work (separate frontend and
backend deploys), keeps responsibilities obvious, and lets each side scale or be
replaced independently. In dev, Vite's proxy makes them *feel* like one origin
so there's no CORS friction.

## The two workspaces

| Workspace   | Responsibility                                              | Runs on            |
| ----------- | ----------------------------------------------------------- | ------------------ |
| `frontend/` | Everything the user sees. Fetches data, renders UI.         | Vercel (static)    |
| `backend/`  | The API + all database access. The only thing touching SQL. | Container + Neon   |

The browser **never** talks to Postgres directly — it only knows about
`/api/*`. That boundary is the whole point.

## Request lifecycle #1 — loading the homepage projects

What happens when someone opens the site:

```
1. Browser loads the React app (index.html → main.jsx → <App/>).
2. <Projects/> mounts and calls fetchProjects() from lib/api.js.
3. fetch GET /api/projects
     dev  → Vite proxy forwards :5173/api → :4000
     prod → request goes straight to VITE_API_URL (the deployed API)
4. Express matches app.use('/api/projects', projects) → routes/projects.js
5. The route runs SQL via db.js:  SELECT * FROM projects ORDER BY ...
6. Postgres returns rows. JSONB `tech` is already a JS array; `featured` a bool.
7. res.json(rows) → JSON travels back to the browser.
8. setProjects(data) → React re-renders → cards animate in (Framer Motion).
```

The key idea: **data flows one direction per request** — component → `lib/api.js`
→ Express route → `db.js` → Postgres, then all the way back as JSON.

## Request lifecycle #2 — reading a blog post

```
/blog/:slug  (React Router)  →  pages/Post.jsx
  └─ fetchPost(slug)  →  GET /api/posts/:slug
       └─ routes/posts.js:  SELECT ... WHERE slug = $1 AND published = TRUE
            └─ 404 if missing/unpublished, else the row (incl. Markdown `body`)
  └─ <ReactMarkdown> renders body → styled by Post.css
```

Note `WHERE published = TRUE`: drafts exist in the database but are invisible to
the public API. Only the admin endpoints can see or change them.

## Request lifecycle #3 — publishing a post (the write path)

This is the one flow that changes data, so it's protected:

```
pages/Admin.jsx  (hidden page, not linked in the nav)
  └─ you paste the ADMIN_TOKEN + write Markdown
  └─ createPost(post, token)  →  POST /api/posts
        headers: { x-admin-token: <token> }
        └─ requireAdmin middleware compares header to process.env.ADMIN_TOKEN
              ✗ no token set  → 503   ✗ wrong token → 401   ✓ match → continue
        └─ INSERT INTO posts (...) RETURNING ...
        └─ 201 + the saved post
```

`requireAdmin` is a deliberately simple shared-secret guard — fine for a
single-author blog. If the blog ever grows multiple authors, that one function
is where real authentication would slot in.

## Where each responsibility lives

```
backend/src/
  server.js      app setup: CORS, JSON parsing, mounts routes, error handler,
                 initDb() then listen()
  db.js          the single Postgres connection Pool + a query() helper
  schema.sql     table definitions (CREATE TABLE IF NOT EXISTS — idempotent)
  init.js        applies schema.sql on boot, so a fresh deploy self-initializes
  seed.js        inserts starter projects + a welcome post (upsert by slug)
  routes/
    projects.js  GET list / GET one
    posts.js     GET list / GET one (public)  +  POST/PUT/DELETE (admin-only)
    github.js    proxy to the GitHub API (keeps any token server-side)

frontend/src/
  main.jsx       mounts <App/> inside <BrowserRouter>
  App.jsx        route table (/, /blog, /blog/:slug, /admin, 404)
  components/
    Layout.jsx   Nav + <Outlet/> + Footer shared across every page
    Nav, Hero, Projects, ProjectCard, Footer
  pages/
    Home, Blog, Post, Admin, NotFound
  lib/api.js     the ONE place that knows the API base URL + does fetches
  index.css      design tokens (color, type, spacing) — the "Apple feel"
```

## Dev vs production — only env vars change

The code is identical in both environments. These four variables do all the
switching:

| Variable        | Local dev                         | Production                          |
| --------------- | --------------------------------- | ----------------------------------- |
| `DATABASE_URL`  | Docker Postgres on localhost      | Neon connection string              |
| `DATABASE_SSL`  | `false`                           | `true`                              |
| `CORS_ORIGIN`   | unset (allow all)                 | `https://e41c.com`                  |
| `VITE_API_URL`  | unset (Vite proxies `/api`)       | the deployed API URL + `/api`       |

That's the payoff of the clean split: shipping to production is a configuration
change, not a code change.
