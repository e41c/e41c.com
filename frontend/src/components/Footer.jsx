import './Footer.css';

const year = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="container footer__inner">
        <div>
          <h2 className="footer__cta">
            Let's build something <span className="gradient-text">great.</span>
          </h2>
          <p className="footer__sub">
            Open to web development roles and freelance projects.
          </p>
        </div>

        <div className="footer__links">
          <a href="mailto:ericgrigor@gmail.com">Email</a>
          <a href="https://github.com/e41c" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn
          </a>
        </div>
      </div>

      <div className="container footer__base">
        <span>© {year} Eric Grigor</span>
        <span>Built with React, Node &amp; SQLite</span>
      </div>
    </footer>
  );
}
