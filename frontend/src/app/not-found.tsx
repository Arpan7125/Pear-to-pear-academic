'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, Search, ArrowLeft, BookOpen } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        className="text-center max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Animated 404 illustration */}
        <motion.div
          className="relative mx-auto mb-8 w-48 h-48"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Background circle */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(135deg, var(--accent-dim), rgba(161,66,244,0.08))',
            }}
          />
          {/* Floating book icon */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <BookOpen size={64} strokeWidth={1.2} style={{ color: 'var(--accent)' }} />
          </motion.div>
          {/* Orbiting dot */}
          <motion.div
            className="absolute w-3 h-3 rounded-full"
            style={{ background: 'var(--accent)', top: '10%', left: '50%' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>

        {/* 404 text */}
        <motion.h1
          className="text-7xl font-black mb-2"
          style={{
            background: 'linear-gradient(135deg, var(--accent), var(--violet))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.04em',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          404
        </motion.h1>

        <motion.h2
          className="text-xl font-bold mb-2"
          style={{ color: 'var(--text-primary)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Page not found
        </motion.h2>

        <motion.p
          className="text-sm mb-8 leading-relaxed"
          style={{ color: 'var(--text-tertiary)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          The resource you&apos;re looking for doesn&apos;t exist or has been moved.
          Try searching for it or head back to the dashboard.
        </motion.p>

        {/* Action buttons */}
        <motion.div
          className="flex items-center justify-center gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Link
            href="/"
            className="btn btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm"
          >
            <Home size={16} /> Dashboard
          </Link>
          <Link
            href="/search"
            className="btn btn-secondary inline-flex items-center gap-2 px-5 py-2.5 text-sm"
          >
            <Search size={16} /> Search
          </Link>
        </motion.div>

        {/* Back link */}
        <motion.div
          className="mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <button
            onClick={() => window.history.back()}
            className="text-xs font-medium inline-flex items-center gap-1 hover:underline transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <ArrowLeft size={12} /> Go back to previous page
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
