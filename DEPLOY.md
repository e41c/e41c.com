# Deploying e41c.com

Frontend → **Vercel**. Backend (Express in Docker) + Postgres → **Railway**.
Both auto-deploy when you `git push` to `main`.

```
 e41c.com (Vercel) ──https──▶ api.e41c.com (Railway: Docker) ──▶ Postgres (Railway)
```

The config files that make this work are already in the repo:
`frontend/vercel.json` (SPA routing) and `backend/railway.json` (Docker build +
health check).

---

## Part 1 — Backend + database on Railway

1. **New project** → *Deploy from GitHub repo* → pick `e41c/e41c.com`.
2. Open the created service → **Settings → Root Directory = `backend`**.
   Railway detects `backend/Dockerfile` and builds it.
3. **Add Postgres**: in the project, *New → Database → PostgreSQL*. It comes up
   always-on (no cold start).
4. **Set the backend service's variables** (Variables tab):

   | Variable         | Value                                   | Notes |
   | ---------------- | --------------------------------------- | ----- |
   | `DATABASE_URL`   | `${{Postgres.DATABASE_URL}}`            | a *reference* to the Postgres service (internal network) |
   | `DATABASE_SSL`   | `false`                                 | internal connection isn't over SSL |
   | `NODE_ENV`       | `production`                            | **required** — turns on Secure/SameSite=None cookies |
   | `JWT_SECRET`     | *(a long random string)*                | see "Secrets" below |
   | `ADMIN_EMAIL`    | `admin@e41c.com`                        | your admin login |
   | `ADMIN_PASSWORD` | *(a strong password)*                   | your admin login |
   | `CORS_ORIGIN`    | `https://e41c.com`                      | use the Vercel URL first, swap to this after DNS |
   | `PORT`           | *(leave unset)*                         | Railway sets it automatically |

5. **Get a URL**: Settings → Networking → *Generate Domain* (gives
   `something.up.railway.app`). You'll point `api.e41c.com` here in Part 3.
6. **Seed the database once** (creates tables' content + the admin user). From
   the Postgres service's *Connect* tab, copy the **public** connection URL, then
   locally:

   ```bash
   cd backend
   DATABASE_URL="<public-postgres-url>" DATABASE_SSL=true npm run seed
   ```

   (The app self-creates the *tables* on boot; this fills in your projects, the
   welcome post, and the admin account.)

## Part 2 — Frontend on Vercel

1. **Add New → Project** → import `e41c/e41c.com`.
2. **Root Directory = `frontend`**. Framework preset auto-detects as **Vite**.
3. **Environment Variable**:

   | Variable        | Value                          |
   | --------------- | ------------------------------ |
   | `VITE_API_URL`  | `https://api.e41c.com/api`     |

   (Before DNS is set, use the Railway-generated domain + `/api`. Changing it
   later just needs a redeploy.)
4. **Deploy.** You get a `*.vercel.app` URL immediately.

## Part 3 — Custom domains & DNS

At your domain registrar (where you bought e41c.com), add:

| Type  | Name  | Points to                          |
| ----- | ----- | ---------------------------------- |
| A/CNAME | `@`  | Vercel (value shown in Vercel UI)  |
| CNAME | `www` | Vercel                             |
| CNAME | `api` | the Railway domain (Railway UI shows the target) |

- In **Vercel → Domains**, add `e41c.com` and `www.e41c.com`.
- In **Railway → Settings → Networking → Custom Domain**, add `api.e41c.com`.
- Both issue free HTTPS certs automatically (can take a few minutes).
- After DNS is live, set `CORS_ORIGIN=https://e41c.com` (Railway) and
  `VITE_API_URL=https://api.e41c.com/api` (Vercel), and redeploy.

> **Why the `api` subdomain matters:** `e41c.com` and `api.e41c.com` are the
> *same site*, so the login cookie is first-party — it works in every browser,
> including Safari/iOS (which block third-party cookies by default). On the raw
> `*.vercel.app` + `*.railway.app` domains, login still works in most browsers
> but can be blocked in Safari. Public pages (home, blog) work everywhere
> regardless. So: ship on the generated domains, then add custom domains to make
> auth bulletproof.

## The ongoing workflow

```
edit code → git push origin main → Vercel + Railway both redeploy automatically
```

Open a PR and each platform builds a **preview deploy** for it, too.

## Secrets

Generate a strong `JWT_SECRET` (never commit it — it only lives in Railway):

```bash
openssl rand -hex 32
```

Set `ADMIN_PASSWORD` to something strong as well. To rotate either later, change
the Railway variable; rotating `ADMIN_PASSWORD` also requires re-running the seed
(Part 1, step 6) so the new hash is written.

## Troubleshooting

| Symptom | Likely cause / fix |
| ------- | ------------------ |
| CORS error in browser console | `CORS_ORIGIN` doesn't exactly match the frontend origin (scheme + host, no trailing slash). |
| Login "works" but you're logged out on refresh | Cookie not stored — ensure `NODE_ENV=production` on Railway (Secure cookie over HTTPS) and you're on HTTPS. |
| Login fails only in Safari | Third-party cookie blocked — finish Part 3 so the API is on `api.e41c.com`. |
| 502 / health check failing | App didn't bind to Railway's `PORT` (it does via `process.env.PORT`) or DB env vars are wrong. Check deploy logs. |
| Site loads but no projects/posts | Database wasn't seeded — do Part 1, step 6. |
