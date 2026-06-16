import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section
      className="container"
      style={{ padding: '12rem 0', textAlign: 'center' }}
    >
      <h1 className="gradient-text" style={{ fontSize: '4rem', fontWeight: 700 }}>
        404
      </h1>
      <p style={{ color: 'var(--text-dim)', marginTop: '0.5rem' }}>
        That page doesn't exist.
      </p>
      <p style={{ marginTop: '1.5rem' }}>
        <Link to="/" className="btn btn-ghost">
          Back home
        </Link>
      </p>
    </section>
  );
}
