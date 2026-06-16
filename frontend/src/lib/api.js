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

// --- projects ---
export const fetchProjects = () => getJSON('/projects');
export const fetchRepos = () => getJSON('/github/repos');

// --- blog ---
export const fetchPosts = () => getJSON('/posts');
export const fetchPost = (slug) => getJSON(`/posts/${slug}`);

// Create a post. Requires the admin token, sent as a header (never in the URL).
export async function createPost(post, token) {
  const res = await fetch(`${BASE}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
    body: JSON.stringify(post),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}
