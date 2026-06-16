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

## Request lifecycle #3 — publishing a post (an authorized write)

Writing data runs through two middlewares in sequence — first *who are you?*,
then *are you allowed?*:

```
pages/Admin.jsx (admins only; sends guests to /login)
  └─ createPost(post)  →  POST /api/posts   (auth cookie sent automatically)
        └─ authenticate          reads the JWT cookie → req.user (or null)
        └─ requireRole('admin')
              req.user is null   → 401  Authentication required
              role !== 'admin'   → 403  Forbidden
              admin              → continue
        └─ INSERT INTO posts (...) RETURNING ...
        └─ 201 + the saved post
```

## Authentication & roles

Identity and permissions are two separate concerns, handled by two small
middlewares in `middleware/auth.js`:

- **`authenticate`** — *authentication*. Reads the JWT from the httpOnly cookie,
  verifies it, and sets `req.user` (or `null` for a guest). It never blocks.
- **`requireRole(...roles)`** — *authorization*. Runs after `authenticate` and
  returns `401` if nobody's logged in, `403` if the role isn't allowed.

```
guest   no account / no cookie     → can read public endpoints only
user    signed up via /api/auth    → a client; can do user-gated actions
admin   seeded server-side only    → can publish/edit/delete posts
```

How a login actually works:

```
/login or /signup  →  POST /api/auth/{login,signup}
  └─ bcrypt verifies (or hashes) the password — plaintext never stored
  └─ signToken() issues a JWT { sub, email, role }, set as an httpOnly cookie
  └─ AuthContext stores the returned user; the cookie rides along on every
     later request, so a refresh stays logged in (GET /api/auth/me answers
     "who am I?" on app load)
```

The cookie is **httpOnly** (JavaScript can't read it, so XSS can't steal the
token), and the JWT is signed with `JWT_SECRET` — the server can verify it
wasn't tampered with, without any server-side session store. Signup always
creates a `user`; the single `admin` exists only because `seed.js` creates it.

## Where each responsibility lives

```
backend/src/
  server.js      app setup: CORS, cookies, mounts routes, error handler,
                 initDb() then listen()
  db.js          the single Postgres connection Pool + a query() helper
  schema.sql     table definitions (users, projects, posts) — idempotent
  init.js        applies schema.sql on boot, so a fresh deploy self-initializes
  seed.js        starter projects + a welcome post + the admin user
  middleware/
    auth.js      authenticate (JWT cookie → req.user) + requireRole(...)
  routes/
    auth.js      signup / login / logout / me  (rate-limited)
    projects.js  GET list / GET one
    posts.js     GET list / GET one (public)  +  POST/PUT/DELETE (admin-only)
    github.js    proxy to the GitHub API (keeps any token server-side)

frontend/src/
  main.jsx       mounts <App/> inside <BrowserRouter> + <AuthProvider>
  App.jsx        route table (/, /blog, /blog/:slug, /login, /signup, /admin, 404)
  context/
    AuthContext  tracks the signed-in user; login/signup/logout helpers
  components/
    Layout.jsx   Nav + <Outlet/> + Footer shared across every page
    Nav, Hero, Projects, ProjectCard, Footer
  pages/
    Home, Blog, Post, Admin, Login, Signup, NotFound
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
| `JWT_SECRET`    | any long random string            | a long random secret (keep it safe) |
| `CORS_ORIGIN`   | unset (allow all)                 | `https://e41c.com`                  |
| `VITE_API_URL`  | unset (Vite proxies `/api`)       | the deployed API URL + `/api`       |

> **Cookie note for production:** because the frontend (Vercel) and API are on
> different domains, the auth cookie is sent cross-site (`SameSite=None; Secure`).
> Hosting the API at a subdomain of your site (e.g. `api.e41c.com`) makes it
> *same-site*, which is simpler and more robust — worth doing when you deploy.

That's the payoff of the clean split: shipping to production is a configuration
change, not a code change.
