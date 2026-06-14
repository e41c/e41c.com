// In dev, VITE_API_URL is empty and Vite proxies /api → :4000 (see
// vite.config.js). In production the frontend (Vercel) and backend (a container
// host) live on different domains, so VITE_API_URL points at the deployed API.
// Same code, no branching.
const BASE = import.meta.env.VITE_API_URL || '/api';

export async function getJSON(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export const fetchProjects = () => getJSON('/projects');
export const fetchRepos = () => getJSON('/github/repos');
