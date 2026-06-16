import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchPosts } from '../lib/api.js';
import './Blog.css';

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  useEffect(() => {
    let active = true;
    fetchPosts()
      .then((data) => {
        if (!active) return;
        setPosts(data);
        setStatus('ready');
      })
      .catch(() => active && setStatus('error'));
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="blog">
      <div className="container">
        <header className="blog__head">
          <p className="eyebrow">Writing</p>
          <h1 className="blog__title">
            Notes &amp; <span className="gradient-text">essays.</span>
          </h1>
          <p className="blog__sub">
            Thoughts on building software, trading systems, and whatever I'm
            learning.
          </p>
        </header>

        {status === 'loading' && <p className="blog__note">Loading…</p>}
        {status === 'error' && (
          <p className="blog__note">Couldn't load posts. Is the API running?</p>
        )}
        {status === 'ready' && posts.length === 0 && (
          <p className="blog__note">No posts yet — check back soon.</p>
        )}

        <div className="blog__list">
          {posts.map((p, i) => (
            <motion.article
              key={p.slug}
              className="post-row"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            >
              <Link to={`/blog/${p.slug}`} className="post-row__link">
                <time className="post-row__date">
                  {fmtDate(p.published_at)}
                </time>
                <h2 className="post-row__title">{p.title}</h2>
                <p className="post-row__excerpt">{p.excerpt}</p>
                <div className="post-row__tags">
                  {(p.tags || []).map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
