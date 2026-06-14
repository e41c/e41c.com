import { Router } from 'express';

const router = Router();

// GET /api/github/repos — live public repos for the configured user.
// Proxied through the backend so the GitHub token (if any) stays server-side
// and the browser never sees it.
router.get('/repos', async (_req, res) => {
  const user = process.env.GITHUB_USERNAME;
  if (!user) return res.json([]); // not configured yet — fail soft

  try {
    const headers = { Accept: 'application/vnd.github+json' };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const r = await fetch(
      `https://api.github.com/users/${user}/repos?sort=updated&per_page=100`,
      { headers },
    );
    if (!r.ok) {
      return res.status(r.status).json({ error: 'GitHub request failed' });
    }

    const data = await r.json();
    const repos = data
      .filter((repo) => !repo.fork)
      .map((repo) => ({
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
        stars: repo.stargazers_count,
        language: repo.language,
        updated: repo.updated_at,
      }));

    res.json(repos);
  } catch {
    res.status(502).json({ error: 'Could not reach GitHub' });
  }
});

export default router;
