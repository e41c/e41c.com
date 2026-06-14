import { motion } from 'framer-motion';
import './ProjectCard.css';

const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M7 17 17 7M17 7H8M17 7v9"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function ProjectCard({ project, index }) {
  const { title, tagline, description, tech, repo_url, live_url, featured } =
    project;

  return (
    <motion.article
      className={`card ${featured ? 'card--featured' : ''}`}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        duration: 0.6,
        delay: (index % 3) * 0.08,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <div className="card__body">
        {featured && <span className="card__badge">Featured</span>}
        <h3 className="card__title">{title}</h3>
        <p className="card__tagline">{tagline}</p>
        <p className="card__desc">{description}</p>

        <ul className="card__tech">
          {tech.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>

      <div className="card__links">
        {repo_url && (
          <a href={repo_url} target="_blank" rel="noreferrer">
            GitHub <ArrowIcon />
          </a>
        )}
        {live_url && (
          <a href={live_url} target="_blank" rel="noreferrer">
            Live <ArrowIcon />
          </a>
        )}
      </div>
    </motion.article>
  );
}
