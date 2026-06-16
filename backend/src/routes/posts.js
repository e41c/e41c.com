import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

// Turn a title (or supplied slug) into a URL-safe slug.
const slugify = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Shared-secret guard for write operations. Set ADMIN_TOKEN in the backend
// env, then send it as the `x-admin-token` header to publish/edit/delete.
// Good enough for a single-author blog; swap for real auth if it grows.
function requireAdmin(req, res, next) {
  const token = process.env.ADMIN_TOKEN;
  if (!token) {
    return res
      .status(503)
      .json({ error: 'Publishing is disabled: ADMIN_TOKEN is not set.' });
  }
  if (req.get('x-admin-token') !== token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// --- public reads --------------------------------------------------------

// GET /api/posts — published posts, newest first (list view omits the body).
router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT slug, title, excerpt, tags, published_at
         FROM posts
        WHERE published = TRUE
        ORDER BY published_at DESC NULLS LAST, created_at DESC`,
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/posts/:slug — a single published post with its full body.
router.get('/:slug', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT slug, title, excerpt, body, tags, published_at
         FROM posts
        WHERE slug = $1 AND published = TRUE`,
      [req.params.slug],
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// --- admin writes (require x-admin-token) --------------------------------

// POST /api/posts — create (and optionally publish) a post.
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { title, excerpt = '', body, tags = [], published = false } =
      req.body ?? {};
    if (!title || !body) {
      return res.status(400).json({ error: 'title and body are required' });
    }
    const slug = req.body.slug ? slugify(req.body.slug) : slugify(title);

    const { rows } = await query(
      `INSERT INTO posts (slug, title, excerpt, body, tags, published, published_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::boolean,
               CASE WHEN $6::boolean THEN now() ELSE NULL END)
       RETURNING slug, title, excerpt, body, tags, published, published_at`,
      [slug, title, excerpt, body, JSON.stringify(tags), published],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res
        .status(409)
        .json({ error: 'A post with that slug already exists' });
    }
    next(err);
  }
});

// PUT /api/posts/:slug — update an existing post. Only provided fields change.
router.put('/:slug', requireAdmin, async (req, res, next) => {
  try {
    const { title, excerpt, body, tags, published } = req.body ?? {};
    const { rows } = await query(
      `UPDATE posts SET
         title        = COALESCE($2, title),
         excerpt      = COALESCE($3, excerpt),
         body         = COALESCE($4, body),
         tags         = COALESCE($5::jsonb, tags),
         published    = COALESCE($6::boolean, published),
         published_at = CASE
                          WHEN $6::boolean IS TRUE AND published_at IS NULL THEN now()
                          WHEN $6::boolean IS FALSE THEN NULL
                          ELSE published_at
                        END,
         updated_at   = now()
       WHERE slug = $1
       RETURNING slug, title, excerpt, body, tags, published, published_at`,
      [
        req.params.slug,
        title ?? null,
        excerpt ?? null,
        body ?? null,
        tags ? JSON.stringify(tags) : null,
        published ?? null,
      ],
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/posts/:slug
router.delete('/:slug', requireAdmin, async (req, res, next) => {
  try {
    const { rowCount } = await query('DELETE FROM posts WHERE slug = $1', [
      req.params.slug,
    ]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
