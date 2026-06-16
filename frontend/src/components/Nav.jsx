import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './Nav.css';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();

  // Frost the bar once the user scrolls past the top — a subtle Apple touch.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
      <div className="nav__inner container">
        <Link to="/" className="nav__brand">
          e41c<span className="gradient-text">.com</span>
        </Link>
        <nav className="nav__links">
          {/* Home sections use hash links; cross-page they land home and scroll. */}
          <a href="/#work">Work</a>
          <Link to="/blog">Writing</Link>

          {user ? (
            <>
              {user.role === 'admin' && <Link to="/admin">Admin</Link>}
              <button className="nav__signout" onClick={logout}>
                Sign out
              </button>
            </>
          ) : (
            <Link to="/login">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
