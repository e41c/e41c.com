import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { query } from '../db.js';
import {
  authenticate,
  signToken,
  cookieName,
  cookieOptions,
} from '../middleware/auth.js';

const router = Router();

// Throttle auth attempts per IP to blunt brute-force / credential stuffing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts — try again in a little while.' },
});

// A real bcrypt hash compared against when the email doesn't exist, so login
// takes the same time whether or not the account is real (avoids leaking which
// emails are registered via response timing).
const DUMMY_HASH = bcrypt.hashSync('timing-equalizer', 10);

const publicUser = (u) => ({ id: u.id, email: u.email, name: u.name, role: u.role });
const isEmail = (s) =>
  typeof s === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);

// POST /api/auth/signup — create a client account. The API never mints admins;
// the only admin is seeded server-side.
router.post('/signup', authLimiter, async (req, res, next) => {
  try {
    const { email, password, name = '' } = req.body ?? {};
    if (!isEmail(email)) {
      return res.status(400).json({ error: 'A valid email is required' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await query(
      `INSERT INTO users (email, name, password_hash, role)
       VALUES ($1, $2, $3, 'user')
       RETURNING id, email, name, role`,
      [email.toLowerCase(), name, hash],
    );

    const user = rows[0];
    res.cookie(cookieName, signToken(user), cookieOptions());
    res.status(201).json(publicUser(user));
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'That email is already registered' });
    }
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { rows } = await query('SELECT * FROM users WHERE email = $1', [
      String(email).toLowerCase(),
    ]);
    const user = rows[0];

    // Always run a compare (real hash or dummy) → uniform timing + one generic
    // error, so we never reveal whether the email exists.
    const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
    if (!user || !ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.cookie(cookieName, signToken(user), cookieOptions());
    res.json(publicUser(user));
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout — clear the cookie.
router.post('/logout', (_req, res) => {
  res.clearCookie(cookieName, { ...cookieOptions(), maxAge: undefined });
  res.status(204).end();
});

// GET /api/auth/me — the current user, or null for a guest. The frontend calls
// this on load to know whether someone is signed in.
router.get('/me', authenticate, async (req, res, next) => {
  try {
    if (!req.user) return res.json(null);
    const { rows } = await query(
      'SELECT id, email, name, role FROM users WHERE id = $1',
      [req.user.id],
    );
    res.json(rows[0] ?? null);
  } catch (err) {
    next(err);
  }
});

export default router;
