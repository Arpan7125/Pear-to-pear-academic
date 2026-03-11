'use client';

import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import LoginPage from './LoginPage';

/* ─── tiny SVG icons ─── */
const icons = {
  share: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  ),
  search: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  star: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  shield: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  users: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  zap: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  book: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  upload: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  ),
  download: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="8 17 12 21 16 17" /><line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  ),
  trophy: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  ),
  arrow: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  ),
};

/* ─── features data ─── */
const features = [
  {
    icon: icons.share,
    title: 'Peer-to-Peer Sharing',
    desc: 'Share academic resources directly with peers — no centralized servers, just pure knowledge exchange.',
    color: 'var(--accent)',
    bg: 'var(--accent-dim)',
  },
  {
    icon: icons.search,
    title: 'Smart Search',
    desc: 'Instantly find notes, papers, and study guides with powerful full-text search and smart filters.',
    color: 'var(--violet)',
    bg: 'var(--violet-dim)',
  },
  {
    icon: icons.star,
    title: 'Ratings & Reviews',
    desc: 'Community-driven quality — rate resources and surface the best content through peer evaluation.',
    color: 'var(--warning)',
    bg: 'var(--warning-dim)',
  },
  {
    icon: icons.shield,
    title: 'Reputation System',
    desc: 'Build your academic reputation. Contributors earn recognition through a transparent scoring system.',
    color: 'var(--success)',
    bg: 'var(--success-dim)',
  },
  {
    icon: icons.users,
    title: 'Active Community',
    desc: 'Connect with fellow students, see who\u2019s contributing, and build a collaborative learning network.',
    color: '#e8710a',
    bg: 'rgba(232, 113, 10, 0.12)',
  },
  {
    icon: icons.zap,
    title: 'Lightning Fast',
    desc: 'Built with Go and Next.js for blazing speed — upload, search, and download with zero lag.',
    color: 'var(--danger)',
    bg: 'var(--danger-dim)',
  },
];

/* ─── how-it-works steps ─── */
const steps = [
  { num: '01', icon: icons.upload, title: 'Upload', desc: 'Share your notes, papers, and study materials with the community.' },
  { num: '02', icon: icons.search, title: 'Discover', desc: 'Search and browse a curated library of peer-shared academic resources.' },
  { num: '03', icon: icons.download, title: 'Download', desc: 'Get the resources you need, instantly — from PDFs to presentations.' },
  { num: '04', icon: icons.trophy, title: 'Earn', desc: 'Build your reputation and climb the leaderboard as a top contributor.' },
];

/* ─── stats ─── */
const stats = [
  { value: '10K+', label: 'Resources Shared' },
  { value: '5K+', label: 'Active Students' },
  { value: '500+', label: 'Institutions' },
  { value: '98%', label: 'Satisfaction' },
];

/* ─── stagger helpers ─── */
const container = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ─── Login Modal Overlay ─── */
  if (showLogin) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-root)' }}>
        {/* Minimal nav */}
        <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-8 py-4"
          style={{ background: 'var(--bg-card)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-subtle)' }}>
          <button onClick={() => setShowLogin(false)} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--accent), #04b490)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Knowledge Exchange</span>
          </button>
          <button onClick={() => setShowLogin(false)} className="btn btn-secondary text-xs py-2 px-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </button>
        </nav>
        <div className="pt-24 flex items-center justify-center min-h-screen">
          <LoginPage />
        </div>
      </div>
    );
  }

  /* ─── Full Landing Page ─── */
  return (
    <div className="landing-page" style={{ background: 'var(--bg-root)', overflowX: 'hidden' }}>

      {/* ━━━━━ NAV ━━━━━ */}
      <motion.nav
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-8 py-4 transition-all duration-300"
        style={{
          background: scrolled ? 'var(--bg-card)' : 'transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          borderBottom: scrolled ? '1px solid var(--border-subtle)' : '1px solid transparent',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--accent), #04b490)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Knowledge Exchange</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="#features" className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
            Features
          </a>
          <a href="#how-it-works" className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
            How It Works
          </a>
          <button onClick={() => setShowLogin(true)} className="btn btn-primary text-xs py-2 px-5">
            Get Started {icons.arrow}
          </button>
        </div>
      </motion.nav>

      {/* ━━━━━ HERO ━━━━━ */}
      <motion.section
        className="relative min-h-screen flex items-center justify-center text-center px-6"
        style={{ y: heroY, opacity: heroOpacity }}
      >
        {/* BG gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(26,115,232,0.08) 0%, transparent 70%)' }} />
          <div className="absolute -bottom-60 -left-40 w-[700px] h-[700px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(161,66,244,0.06) 0%, transparent 70%)' }} />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(4,180,144,0.05) 0%, transparent 70%)' }} />
        </div>

        {/* Floating document cards (decorative) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          {[
            { top: '12%', left: '8%', rotate: -12, delay: 0, color: '#ea4335' },
            { top: '18%', right: '10%', rotate: 8, delay: 0.4, color: '#4285f4' },
            { bottom: '22%', left: '12%', rotate: 6, delay: 0.8, color: '#fbbc05' },
            { bottom: '16%', right: '8%', rotate: -8, delay: 1.2, color: '#34a853' },
            { top: '40%', left: '4%', rotate: -4, delay: 0.6, color: '#a142f4' },
            { top: '35%', right: '5%', rotate: 10, delay: 1.0, color: '#1a73e8' },
          ].map((item, i) => (
            <motion.div
              key={i}
              className="absolute w-14 h-18 rounded-lg"
              style={{
                ...item,
                background: 'var(--bg-card-solid)',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
              }}
              initial={{ opacity: 0, y: 40, rotate: item.rotate * 2 }}
              animate={{
                opacity: 0.6,
                y: [0, -12, 0],
                rotate: item.rotate,
              }}
              transition={{
                opacity: { delay: 0.5 + item.delay, duration: 0.8 },
                y: { delay: 0.5 + item.delay, duration: 5, repeat: Infinity, ease: 'easeInOut' },
                rotate: { delay: 0.5 + item.delay, duration: 0.8 },
              }}
            >
              {/* Mini doc lines */}
              <div className="p-2 space-y-1.5">
                <div className="w-full h-1 rounded-full" style={{ background: item.color, opacity: 0.6 }} />
                <div className="w-3/4 h-0.5 rounded-full" style={{ background: 'var(--border-mid)' }} />
                <div className="w-full h-0.5 rounded-full" style={{ background: 'var(--border-mid)' }} />
                <div className="w-2/3 h-0.5 rounded-full" style={{ background: 'var(--border-mid)' }} />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Pill badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8"
            style={{
              background: 'var(--accent-dim)',
              color: 'var(--accent)',
              border: '1px solid rgba(26,115,232,0.15)',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--success)' }} />
            Open-source &amp; Free for Students
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <span style={{ color: 'var(--text-primary)' }}>Share Knowledge,</span>
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, var(--accent) 0%, #04b490 50%, var(--violet) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Grow Together
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
          >
            A decentralized peer-to-peer platform where students share notes, papers, and study
            materials — building a collaborative academic ecosystem.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            className="flex items-center justify-center gap-4 flex-wrap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <motion.button
              onClick={() => setShowLogin(true)}
              className="btn text-sm font-bold py-3.5 px-8 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, var(--accent), #04b490)',
                color: 'white',
                boxShadow: '0 4px 20px rgba(26,115,232,0.3)',
                border: 'none',
              }}
              whileHover={{ scale: 1.04, boxShadow: '0 8px 32px rgba(26,115,232,0.4)' }}
              whileTap={{ scale: 0.98 }}
            >
              Start Sharing {icons.arrow}
            </motion.button>
            <motion.a
              href="#features"
              className="btn btn-secondary text-sm py-3.5 px-8 rounded-xl"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              Learn More
            </motion.a>
          </motion.div>

          {/* Tech badges */}
          <motion.div
            className="flex items-center justify-center gap-6 mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            {['Built with Go', 'Next.js Frontend', 'P2P Architecture'].map((t) => (
              <span key={t} className="text-xs font-medium px-3 py-1 rounded-full"
                style={{ color: 'var(--text-tertiary)', background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)' }}>
                {t}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </motion.div>
      </motion.section>

      {/* ━━━━━ STATS BAR ━━━━━ */}
      <motion.section
        className="relative py-16 px-6"
        style={{ background: 'var(--bg-card-solid)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={container}
      >
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <motion.div key={s.label} className="text-center" variants={fadeUp}>
              <div className="text-3xl md:text-4xl font-extrabold mb-1"
                style={{
                  background: 'linear-gradient(135deg, var(--accent), var(--violet))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                {s.value}
              </div>
              <div className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ━━━━━ FEATURES ━━━━━ */}
      <section id="features" className="py-24 px-6">
        <motion.div
          className="max-w-6xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={container}
        >
          {/* Section header */}
          <motion.div className="text-center mb-16" variants={fadeUp}>
            <span className="text-xs font-bold uppercase tracking-[0.2em] mb-3 inline-block"
              style={{ color: 'var(--accent)' }}>Features</span>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: 'var(--text-primary)' }}>
              Everything you need for academic collaboration
            </h2>
            <p className="text-base max-w-lg mx-auto" style={{ color: 'var(--text-secondary)' }}>
              A complete toolkit for sharing, discovering, and rating academic resources — designed by students, for students.
            </p>
          </motion.div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="group relative rounded-2xl p-6 transition-all duration-300"
                style={{
                  background: 'var(--bg-card-solid)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                }}
                variants={fadeUp}
                whileHover={{
                  y: -4,
                  boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
                  borderColor: 'rgba(0,0,0,0.12)',
                }}
              >
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: f.bg, color: f.color }}
                >
                  {f.icon}
                </div>
                <h3 className="text-base font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ━━━━━ HOW IT WORKS ━━━━━ */}
      <section id="how-it-works" className="py-24 px-6" style={{ background: 'var(--bg-card-solid)' }}>
        <motion.div
          className="max-w-5xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={container}
        >
          <motion.div className="text-center mb-16" variants={fadeUp}>
            <span className="text-xs font-bold uppercase tracking-[0.2em] mb-3 inline-block"
              style={{ color: 'var(--violet)' }}>How It Works</span>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: 'var(--text-primary)' }}>
              Four steps to academic collaboration
            </h2>
            <p className="text-base max-w-lg mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Get started in minutes — share resources, earn reputation, and help your peers succeed.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                className="relative text-center p-6 rounded-2xl"
                style={{ background: 'var(--bg-root)', border: '1px solid var(--border-subtle)' }}
                variants={fadeUp}
                whileHover={{ y: -4 }}
              >
                {/* Step number */}
                <div className="text-5xl font-black mb-4"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent), var(--violet))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    opacity: 0.15,
                  }}>
                  {s.num}
                </div>
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                  {s.icon}
                </div>
                <h3 className="text-base font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{s.title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{s.desc}</p>

                {/* Connector arrow (except last) */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 -translate-y-1/2 z-10"
                    style={{ color: 'var(--border-mid)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ━━━━━ SHOWCASE / PREVIEW ━━━━━ */}
      <section className="py-24 px-6 overflow-hidden">
        <motion.div
          className="max-w-5xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={container}
        >
          <motion.div className="text-center mb-14" variants={fadeUp}>
            <span className="text-xs font-bold uppercase tracking-[0.2em] mb-3 inline-block"
              style={{ color: 'var(--success)' }}>Preview</span>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: 'var(--text-primary)' }}>
              A beautiful interface, designed for focus
            </h2>
            <p className="text-base max-w-lg mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Clean, modern, and distraction-free — so you can focus on what matters: learning.
            </p>
          </motion.div>

          {/* Mockup browser window */}
          <motion.div
            className="relative mx-auto rounded-2xl overflow-hidden"
            style={{
              background: 'var(--bg-card-solid)',
              border: '1px solid var(--border-mid)',
              boxShadow: '0 20px 80px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
              maxWidth: '900px',
            }}
            variants={fadeUp}
          >
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface-2)' }}>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
              </div>
              <div className="flex-1 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-lg text-xs font-medium"
                  style={{ background: 'var(--bg-card-solid)', color: 'var(--text-tertiary)', border: '1px solid var(--border-subtle)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  localhost:3001/library
                </div>
              </div>
            </div>

            {/* Fake app preview */}
            <div className="flex" style={{ minHeight: '340px' }}>
              {/* Mini sidebar */}
              <div className="w-48 p-4 hidden md:block" style={{ borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-card-solid)' }}>
                <div className="space-y-1">
                  {['Library', 'Search', 'My Files', 'Upload', 'Peers', 'Leaderboard'].map((item, i) => (
                    <div key={item} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold"
                      style={{
                        background: i === 0 ? 'var(--accent-dim)' : 'transparent',
                        color: i === 0 ? 'var(--accent)' : 'var(--text-secondary)',
                      }}>
                      <div className="w-4 h-4 rounded" style={{ background: i === 0 ? 'var(--accent-dim)' : 'var(--bg-surface-2)' }} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Content area */}
              <div className="flex-1 p-5">
                <div className="mb-4">
                  <div className="h-5 w-32 rounded-lg mb-1" style={{ background: 'var(--text-primary)', opacity: 0.08 }} />
                  <div className="h-3 w-56 rounded" style={{ background: 'var(--text-primary)', opacity: 0.04 }} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { name: 'Data Structures Notes.pdf', type: 'PDF', color: '#ea4335' },
                    { name: 'Machine Learning Guide.pdf', type: 'PDF', color: '#ea4335' },
                    { name: 'Operating Systems.pptx', type: 'PPT', color: '#fbbc05' },
                    { name: 'Web Development.docx', type: 'DOC', color: '#4285f4' },
                  ].map((file) => (
                    <div key={file.name} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ border: '1px solid var(--border-subtle)' }}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-[.6rem] font-bold flex-shrink-0"
                        style={{ background: file.color }}>
                        {file.type}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{file.name}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <svg key={s} width="10" height="10" viewBox="0 0 24 24" fill={s <= 4 ? '#fbbc05' : 'none'} stroke="#fbbc05" strokeWidth="2">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          ))}
                          <span className="text-[.6rem] ml-1" style={{ color: 'var(--text-tertiary)' }}>4.2</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ━━━━━ CTA ━━━━━ */}
      <section className="py-24 px-6">
        <motion.div
          className="max-w-3xl mx-auto text-center rounded-3xl p-12 md:p-16 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, var(--accent) 0%, #04b490 50%, var(--violet) 100%)',
            boxShadow: '0 20px 60px rgba(26,115,232,0.2)',
          }}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-60 h-60 rounded-full"
            style={{ background: 'rgba(255,255,255,0.06)', transform: 'translate(30%, -30%)' }} />
          <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full"
            style={{ background: 'rgba(255,255,255,0.04)', transform: 'translate(-30%, 30%)' }} />

          <div className="relative z-10">
            <motion.div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              {icons.book}
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Ready to join the community?
            </h2>
            <p className="text-base text-white/80 max-w-md mx-auto mb-8">
              Start sharing your academic resources today and help build a better learning ecosystem for everyone.
            </p>
            <motion.button
              onClick={() => setShowLogin(true)}
              className="btn text-sm font-bold py-3.5 px-10 rounded-xl"
              style={{
                background: 'white',
                color: 'var(--accent)',
                border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              }}
              whileHover={{ scale: 1.05, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
              whileTap={{ scale: 0.97 }}
            >
              Get Started — It&apos;s Free {icons.arrow}
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* ━━━━━ FOOTER ━━━━━ */}
      <footer className="py-10 px-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--accent), #04b490)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Knowledge Exchange</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Built with Go + Next.js &middot; P2P Academic Resource Sharing &middot; &copy; {new Date().getFullYear()}
          </p>
          <div className="flex items-center gap-4">
            <a href="#features" className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Features</a>
            <a href="#how-it-works" className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>How It Works</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
