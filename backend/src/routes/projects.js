import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

// With Postgres, `tech` (JSONB) comes back as a real JS array and `featured`
// (BOOLEAN) as a real boolean — no manual parsing needed. Errors are forwarded
// to the central handler in server.js via next(err).

// GET /api/projects — all projects, ordered for display.
router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM projects ORDER BY sort_order ASC, created_at DESC',
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:slug — a single project (for a future detail page).
router.get('/:slug', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM projects WHERE slug = $1', [
      req.params.slug,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
