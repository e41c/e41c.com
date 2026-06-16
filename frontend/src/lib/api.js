// In dev, VITE_API_URL is empty and Vite proxies /api → :4000 (see
// vite.config.js). In production the frontend (Vercel) and backend (a container
// host) live on different domains, so VITE_API_URL points at the deployed API.
const BASE = import.meta.env.VITE_API_URL || '/api';

// One fetch wrapper for the whole app. `credentials: 'include'` makes the
// browser send (and store) the httpOnly auth cookie on every request.
async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    ...options,
  });
  const data = await res.json().catch(() => null); // 204s have no body
  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed: ${res.status}`);
  }
  return data;
}

const jsonBody = (body) => ({
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const getJSON = (path) => request(path);

// --- projects ---
export const fetchProjects = () => getJSON('/projects');
export const fetchRepos = () => getJSON('/github/repos');

// --- blog ---
export const fetchPosts = () => getJSON('/posts');
export const fetchPost = (slug) => getJSON(`/posts/${slug}`);
// Auth now travels via the cookie, so no token argument is needed.
export const createPost = (post) =>
  request('/posts', { method: 'POST', ...jsonBody(post) });

// --- auth ---
export const signup = (body) =>
  request('/auth/signup', { method: 'POST', ...jsonBody(body) });
export const login = (body) =>
  request('/auth/login', { method: 'POST', ...jsonBody(body) });
export const logout = () => request('/auth/logout', { method: 'POST' });
export const fetchMe = () => getJSON('/auth/me');
