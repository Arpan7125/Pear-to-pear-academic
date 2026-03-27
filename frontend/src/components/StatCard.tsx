'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  accent?: string;
}

function useAnimatedCounter(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return count;
}

export default function StatCard({ title, value, icon, trend, accent }: StatCardProps) {
  const accentColor = accent ?? 'var(--accent)';
  const numericValue = typeof value === 'number' ? value : parseInt(String(value), 10);
  const isNumeric = !isNaN(numericValue);
  const animatedValue = useAnimatedCounter(isNumeric ? numericValue : 0);
  const displayValue = isNumeric ? animatedValue : value;

  return (
    <motion.div
      className="stat-card group"
      whileHover={{ y: -4, transition: { duration: 0.3 } }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[.72rem] font-semibold mb-2 tracking-wide" style={{ color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</p>
          <p className="text-[2rem] font-extrabold leading-none counter-value" style={{ color: accentColor }}>
            {displayValue}
          </p>
          {trend && (
            <div className="flex items-center gap-1.5 mt-2.5">
              <span
                className="inline-flex items-center gap-1 text-[.72rem] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: trend.isPositive ? 'var(--success-dim)' : 'var(--danger-dim)',
                  color: trend.isPositive ? 'var(--success)' : 'var(--danger)',
                }}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-[.68rem]" style={{ color: 'var(--text-tertiary)' }}>this week</span>
            </div>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
          style={{
            background: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
            color: accentColor,
            border: `1px solid color-mix(in srgb, ${accentColor} 15%, transparent)`,
          }}
        >
          {icon}
        </div>
      </div>
      {/* Decorative bottom gradient line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
        }}
      />
    </motion.div>
  );
}
