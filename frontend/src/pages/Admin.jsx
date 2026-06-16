import { useState } from 'react';
import { createPost } from '../lib/api.js';
import './Admin.css';

const EMPTY = {
  title: '',
  slug: '',
  excerpt: '',
  tags: '',
  body: '',
  published: true,
};

export default function Admin() {
  const [token, setToken] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const update = (key) => (e) =>
    setForm((f) => ({
      ...f,
      [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const saved = await createPost(
        {
          title: form.title,
          slug: form.slug || undefined,
          excerpt: form.excerpt,
          body: form.body,
          tags: form.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          published: form.published,
        },
        token,
      );
      setMsg({ type: 'ok', text: `Saved “${saved.title}” → /blog/${saved.slug}` });
      setForm(EMPTY);
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin">
      <div className="container container--narrow">
        <p className="eyebrow">Admin</p>
        <h1 className="admin__title">Write a post</h1>
        <p className="admin__note">
          Paste your <code>ADMIN_TOKEN</code>, write in Markdown, publish. This
          page isn't linked anywhere on the site.
        </p>

        <form className="admin__form" onSubmit={submit}>
          <label>
            Admin token
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />
          </label>
          <label>
            Title
            <input value={form.title} onChange={update('title')} required />
          </label>
          <label>
            Slug <span className="admin__hint">(optional — auto from title)</span>
            <input value={form.slug} onChange={update('slug')} />
          </label>
          <label>
            Excerpt
            <input value={form.excerpt} onChange={update('excerpt')} />
          </label>
          <label>
            Tags <span className="admin__hint">(comma-separated)</span>
            <input value={form.tags} onChange={update('tags')} />
          </label>
          <label>
            Body <span className="admin__hint">(Markdown)</span>
            <textarea rows={16} value={form.body} onChange={update('body')} required />
          </label>
          <label className="admin__check">
            <input
              type="checkbox"
              checked={form.published}
              onChange={update('published')}
            />
            Publish immediately
          </label>

          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save post'}
          </button>
        </form>

        {msg && (
          <p className={`admin__msg admin__msg--${msg.type}`}>{msg.text}</p>
        )}
      </div>
    </section>
  );
}
