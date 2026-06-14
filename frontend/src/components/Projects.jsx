import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ProjectCard from './ProjectCard.jsx';
import { fetchProjects } from '../lib/api.js';
import './Projects.css';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  useEffect(() => {
    let active = true;
    fetchProjects()
      .then((data) => {
        if (!active) return;
        setProjects(data);
        setStatus('ready');
      })
      .catch(() => active && setStatus('error'));
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="work" id="work">
      <div className="container">
        <motion.div
          className="work__head"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="eyebrow">Selected Work</p>
          <h2 className="work__title">
            Things I've <span className="gradient-text">built.</span>
          </h2>
        </motion.div>

        {status === 'loading' && <p className="work__note">Loading projects…</p>}
        {status === 'error' && (
          <p className="work__note">
            Couldn't reach the API. Is the backend running on :4000?
          </p>
        )}

        {status === 'ready' && (
          <div className="work__grid">
            {projects.map((p, i) => (
              <ProjectCard key={p.slug} project={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
