'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const { login, signup } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Generate random particles once
  const particles = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: 2 + Math.random() * 4,
      duration: 6 + Math.random() * 10,
      delay: Math.random() * 5,
      opacity: 0.1 + Math.random() * 0.3,
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
    { name: 'charlie', role: 'User', icon: '📚' },
    { name: 'diana', role: 'User', icon: '✨' },
  ];

  return (
    <div className="relative w-full max-w-lg mx-auto px-4">
      {/* Floating particles background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {particles.map(p => (
          <div
            key={p.id}
            className="particle"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
              animation: `particle-float ${p.duration}s ease-in-out ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="card-glow" style={{ padding: '2.5rem 2rem' }}>
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              className="relative mx-auto mb-5 w-16 h-16"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, duration: 0.6, type: 'spring', stiffness: 200 }}
            >
              <div
                className="absolute inset-0 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, var(--accent), var(--violet))',
                  filter: 'blur(16px)',
                  opacity: 0.35,
                  animation: 'glow-pulse 3s ease-in-out infinite',
                }}
              />
              <div
                className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, var(--accent), #04b490)',
                  boxShadow: '0 0 30px rgba(6, 214, 160, 0.3)',
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-inverse)" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </motion.div>
            <motion.h1
              className="text-2xl font-bold"
              style={{ color: 'var(--text-primary)' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              Knowledge Exchange
            </motion.h1>
            <motion.p
              className="text-sm mt-1.5"
              style={{ color: 'var(--text-tertiary)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              P2P Academic Library
            </motion.p>
          </div>

          {/* Tabs */}
          <div className="flex mb-6 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}>
            {['Sign In', 'Sign Up'].map((label, i) => {
              const isActive = i === 0 ? !isSignup : isSignup;
              return (
                <button
                  key={label}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 relative"
                  style={{
                    color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
                    background: isActive ? 'var(--accent-dim)' : 'transparent',
                  }}
                  onClick={() => { setIsSignup(i === 1); setError(''); }}
                >
                  {label}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-[20%] right-[20%] h-[2px] rounded-full"
                      style={{ background: 'var(--accent)' }}
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
              className="space-y-4"
              initial={{ opacity: 0, x: isSignup ? 15 : -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isSignup ? -15 : 15 }}
              transition={{ duration: 0.25 }}
            >
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="modal-input"
                  required
                />
              </div>
              {isSignup && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter email"
                    className="modal-input"
                    required
                  />
                </motion.div>
              )}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="modal-input"
                  required
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    className="rounded-xl px-4 py-3 text-xs font-medium"
                    style={{
                      color: 'var(--danger)',
                      background: 'var(--danger-dim)',
                      border: '1px solid rgba(244, 63, 94, 0.2)',
                    }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button type="submit" className="btn btn-primary w-full" style={{ padding: '12px 22px', fontSize: '0.95rem' }} disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="60" strokeDashoffset="20" />
                    </svg>
                    {isSignup ? 'Creating account…' : 'Signing in…'}
                  </span>
                ) : (
                  isSignup ? 'Create Account' : 'Sign In'
                )}
              </button>
            </motion.form>
          </AnimatePresence>

          {/* Quick login */}
          {!isSignup && (
            <motion.div
              className="mt-6 pt-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="divider-glow" />
              <p className="text-xs text-center mb-4 font-medium" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Demo Accounts</p>
              <div className="grid grid-cols-2 gap-2.5">
                {demoUsers.map((u, i) => (
                  <motion.button
                    key={u.name}
                    onClick={() => quickLogin(u.name)}
                    className="btn btn-secondary text-xs flex-col gap-0.5 py-3"
                    disabled={loading}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 + i * 0.08 }}
                  >
                    <span className="text-base mb-0.5">{u.icon}</span>
                    <span className="font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>{u.name}</span>
                    <span className="text-[.6rem]" style={{ color: u.role === 'Admin' ? 'var(--accent)' : 'var(--text-tertiary)' }}>{u.role}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
