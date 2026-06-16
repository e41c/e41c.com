import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;
export const cookieName = 'token';

// Sign a short-lived token carrying just enough to identify the user. We keep
// the payload minimal (id, email, role) — never put secrets in a JWT, since
// anyone can decode (not forge) its contents.
export function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, SECRET, {
    expiresIn: '7d',
  });
}

// Cookie settings differ by environment. The token lives in an httpOnly cookie
// so JavaScript (and therefore XSS) can't read it. Cross-site in production
// (Vercel frontend ↔ separate API domain) requires SameSite=None + Secure.
export function cookieOptions() {
  const prod = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: prod,
    sameSite: prod ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };
}

// AUTHENTICATION — "who are you?". Reads the cookie if present and attaches
// req.user. Never blocks: a guest simply passes through with req.user = null.
export function authenticate(req, _res, next) {
  const token = req.cookies?.[cookieName];
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const payload = jwt.verify(token, SECRET);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
  } catch {
    req.user = null; // expired or tampered → treat as guest
  }
  next();
}

// AUTHORIZATION — "what may you do?". Gate a route by role. Must run after
// authenticate. 401 if not logged in, 403 if logged in but wrong role.
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
