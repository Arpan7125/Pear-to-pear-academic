'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Search, BookOpen, ShieldCheck } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function LoginPage() {
  const { login, signup } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Generate random particles for the branding side
  const particles = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() > 0.5 ? 3 + Math.random() * 4 : 2,
      duration: 10 + Math.random() * 20,
      delay: Math.random() * 5,
      opacity: 0.1 + Math.random() * 0.4,
    })), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignup) {
        await signup(username, email, password);
      } else {
        await login(username, password);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (name: string) => {
    setError('');
    setLoading(true);
    try {
      await login(name, 'password');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const demoUsers = [
    { name: 'alice', role: 'Admin', icon: '👑' },
    { name: 'bob', role: 'User', icon: '🔬' },
  ];

  return (
    <div className="min-h-screen w-full flex bg-[var(--bg-root)] overflow-hidden">
      
      {/* ── Left Branding Panel (Hidden on Mobile) ── */}
      <div className="hidden lg:flex relative w-1/2 flex-col justify-between p-12 overflow-hidden border-r border-[var(--border-subtle)]" style={{ background: 'var(--bg-card-solid)' }}>
        
        {/* Animated Mesh/Glow Background */}
        <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen" style={{ filter: 'blur(80px)' }}>
          <motion.div 
            className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full"
            style={{ background: 'var(--accent)' }}
            animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full"
            style={{ background: 'var(--violet)' }}
            animate={{ x: [0, -50, 0], y: [0, -30, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map(p => (
            <div
              key={p.id}
              className="absolute rounded-full bg-white transition-opacity"
              style={{
                left: p.left, top: p.top, width: p.size, height: p.size, opacity: p.opacity,
                boxShadow: '0 0 10px rgba(255,255,255,0.5)',
                animation: `particle-float ${p.duration}s ease-in-out ${p.delay}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Logo Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[var(--accent)] to-[var(--violet)] shadow-[0_0_20px_var(--accent-dim)]">
            <Network className="text-white" size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Knowledge Exchange</span>
        </div>

        {/* Center Content */}
        <div className="relative z-10 max-w-lg mt-[-10%]">
          <motion.h1 
            className="text-5xl md:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6 text-[var(--text-primary)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Decentralized<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-[var(--violet)]">
              Academic Library
            </span>
          </motion.h1>
          <motion.p 
            className="text-lg text-[var(--text-secondary)] mb-10 leading-relaxed font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Join a peer-to-peer network designed for students, researchers, and academics. Share, discover, and review study materials without central authority bottlenecks.
          </motion.p>

          {/* Feature Pills */}
          <motion.div 
            className="flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm font-semibold text-[var(--text-secondary)] shadow-sm">
              <Search size={16} className="text-[var(--accent)]" /> Global Search
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm font-semibold text-[var(--text-secondary)] shadow-sm">
              <BookOpen size={16} className="text-[var(--violet)]" /> 10k+ Resources
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm font-semibold text-[var(--text-secondary)] shadow-sm">
              <ShieldCheck size={16} className="text-[var(--success)]" /> Peer Reviewed
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-[var(--text-tertiary)] font-medium tracking-wide">
          © {new Date().getFullYear()} P2P Protocol • Open Source Academic Exchange
        </div>
      </div>

      {/* ── Right Auth Panel ── */}
      <div className="relative w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="absolute top-6 right-6 z-20">
          <ThemeToggle />
        </div>

        <motion.div 
          className="w-full max-w-[420px]"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="lg:hidden text-center mb-10">
            <div className="mx-auto w-14 h-14 mb-4 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[var(--accent)] to-[var(--violet)] shadow-lg">
              <Network className="text-white" size={28} />
            </div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Knowledge Exchange</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">P2P Academic Library</p>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2 tracking-tight">
              {isSignup ? 'Create an account' : 'Welcome back'}
            </h2>
            <p className="text-[var(--text-secondary)] text-sm">
              {isSignup ? 'Join the decentralized network today.' : 'Enter your credentials to access the network.'}
            </p>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl">
            {/* Tabs */}
            <div className="flex p-1 mb-8 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)]">
              {['Sign In', 'Sign Up'].map((label, i) => {
                const isActive = i === 0 ? !isSignup : isSignup;
                return (
                  <button
                    key={label}
                    className="flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all relative z-10"
                    style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
                    onClick={() => { setIsSignup(i === 1); setError(''); }}
                  >
                    {label}
                    {isActive && (
                      <motion.div
                        layoutId="authTab"
                        className="absolute inset-0 rounded-lg bg-[var(--bg-elevated)] shadow-sm -z-10"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Form */}
            <AnimatePresence mode="wait">
              <motion.form
                key={isSignup ? 'signup' : 'signin'}
                onSubmit={handleSubmit}
                className="space-y-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-glow)] focus:border-[var(--accent)] transition-all font-medium placeholder-[var(--text-tertiary)]"
                    required
                  />
                </div>
                
                {isSignup && (
                  <motion.div className="space-y-1.5" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="name@university.edu"
                      className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-glow)] focus:border-[var(--accent)] transition-all font-medium placeholder-[var(--text-tertiary)]"
                      required
                    />
                  </motion.div>
                )}
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-glow)] focus:border-[var(--accent)] transition-all font-medium placeholder-[var(--text-tertiary)]"
                    required
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -5, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-[var(--danger-dim)] border border-[var(--danger)] text-[var(--danger)] text-sm px-4 py-3 rounded-xl font-medium"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-[var(--text-primary)] hover:bg-[var(--text-secondary)] text-[var(--bg-root)] font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="60" strokeDashoffset="20" />
                      </svg>
                      {isSignup ? 'Creating abstract...' : 'Decrypting...'}
                    </>
                  ) : (
                    isSignup ? 'Initialize Node' : 'Connect to Network'
                  )}
                </button>
              </motion.form>
            </AnimatePresence>

            {/* Quick Demo Login */}
            {!isSignup && (
              <motion.div className="mt-8 pt-6 border-t border-[var(--border-subtle)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                <p className="text-xs text-center text-[var(--text-tertiary)] uppercase tracking-wider font-bold mb-4">Fast Access Nodes</p>
                <div className="grid grid-cols-2 gap-3">
                  {demoUsers.map((u) => (
                    <button
                      key={u.name}
                      onClick={() => quickLogin(u.name)}
                      disabled={loading}
                      className="flex flex-col items-center gap-1 p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] hover:border-[var(--border-mid)] hover:bg-[var(--bg-hover)] transition-all hover:-translate-y-1 shadow-sm"
                    >
                      <span className="text-xl mb-1">{u.icon}</span>
                      <span className="text-sm font-bold text-[var(--text-primary)] capitalize">{u.name}</span>
                      <span className="text-[0.65rem] font-bold uppercase tracking-wider" style={{ color: u.role === 'Admin' ? 'var(--accent)' : 'var(--text-tertiary)' }}>{u.role}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
