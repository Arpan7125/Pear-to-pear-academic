'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

  // Prevent hydration mismatch
  useEffect(() => {
    let isMounted = true;
    if (isMounted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
    }
    return () => { isMounted = false; };
  }, []);
  if (!mounted) {
    return (
      <button className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--bg-input)] opacity-50 cursor-default">
        <Sun size={18} className="text-[var(--text-tertiary)]" />
      </button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:bg-[var(--accent-dim)]"
      style={{
        background: 'var(--bg-input)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02) inset'
      }}
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isDark ? 'dark' : 'light'}
          initial={{ y: -20, opacity: 0, scale: 0.5, rotate: -45 }}
          animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
          exit={{ y: 20, opacity: 0, scale: 0.5, rotate: 45 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 200, damping: 10 }}
        >
          {isDark ? (
            <Moon size={18} style={{ color: 'var(--accent)' }} />
          ) : (
            <Sun size={18} style={{ color: '#f9ab00' }} />
          )}
        </motion.div>
      </AnimatePresence>
    </button>
  );
}
