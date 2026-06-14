import { motion } from 'framer-motion';
import './Hero.css';

// A small helper so each line rises into place in sequence.
const rise = {
  hidden: { opacity: 0, y: 24 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero__glow" aria-hidden="true" />
      <div className="container hero__inner">
        <motion.p
          className="eyebrow"
          variants={rise}
          custom={0}
          initial="hidden"
          animate="show"
        >
          Software Engineer
        </motion.p>

        <motion.h1
          className="hero__title"
          variants={rise}
          custom={1}
          initial="hidden"
          animate="show"
        >
          I build fast, beautiful
          <br />
          <span className="gradient-text">fullstack web apps.</span>
        </motion.h1>

        <motion.p
          className="hero__lede"
          variants={rise}
          custom={2}
          initial="hidden"
          animate="show"
        >
          Hi, I'm Eric Grigor. I design and engineer end-to-end products — from
          pixel-perfect interfaces to the APIs and databases behind them — plus
          algorithmic trading systems on the side.
        </motion.p>

        <motion.div
          className="hero__cta"
          variants={rise}
          custom={3}
          initial="hidden"
          animate="show"
        >
          <a href="#work" className="btn btn-primary">
            View my work
          </a>
          <a href="#contact" className="btn btn-ghost">
            Get in touch
          </a>
        </motion.div>
      </div>
    </section>
  );
}
