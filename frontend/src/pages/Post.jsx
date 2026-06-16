import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fetchPost } from '../lib/api.js';
import './Post.css';

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

export default function Post() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  useEffect(() => {
    let active = true;
    setStatus('loading');
    fetchPost(slug)
      .then((data) => {
        if (!active) return;
        setPost(data);
        setStatus('ready');
      })
      .catch(() => active && setStatus('error'));
    return () => {
      active = false;
    };
  }, [slug]);

  return (
    <article className="article">
      <div className="container container--narrow">
        <Link to="/blog" className="article__back">
          ← All writing
        </Link>

        {status === 'loading' && <p className="article__note">Loading…</p>}
        {status === 'error' && (
          <p className="article__note">
            Post not found. <Link to="/blog">Back to writing</Link>.
          </p>
        )}

        {status === 'ready' && post && (
          <>
            <time className="article__date">{fmtDate(post.published_at)}</time>
            <h1 className="article__title">{post.title}</h1>
            <div className="article__body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {post.body}
              </ReactMarkdown>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
