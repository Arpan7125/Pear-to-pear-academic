'use client';

import { useEffect, useState } from 'react';
import { User } from '@/lib/types';
import * as api from '@/lib/api';
import ReputationBadge from '@/components/ReputationBadge';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { motion } from 'framer-motion';
import { Trophy, Upload, Download, Star } from 'lucide-react';

export default function LeaderboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLeaderboard(20).then(setUsers).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton type="card" count={8} />;

  const topThree = users.slice(0, 3);
  const rest = users.slice(3);

  const medals = ['🥇', '🥈', '🥉'];
  const podiumConfigs = [
    { color: '#fbbf24', glow: 'rgba(251, 191, 36, 0.2)', height: '180px' },
    { color: '#94a3b8', glow: 'rgba(148, 163, 184, 0.15)', height: '140px' },
    { color: '#fb923c', glow: 'rgba(251, 146, 60, 0.15)', height: '120px' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <Trophy size={18} style={{ color: 'var(--warning)' }} />
          <h1 className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Leaderboard</h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Top contributors ranked by reputation score</p>
      </motion.div>

      {/* Podium */}
      <motion.div
        className="grid grid-cols-3 gap-5 max-w-2xl mx-auto items-end"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        {[1, 0, 2].map((idx, displayIdx) => {
          const u = topThree[idx];
          if (!u) return <div key={idx} />;
          const cfg = podiumConfigs[idx];
          return (
            <motion.div
              key={u.id}
              className="card text-center relative overflow-visible"
              style={{
                borderColor: cfg.color,
                borderWidth: idx === 0 ? '1.5px' : '1px',
                boxShadow: idx === 0 ? `0 0 40px ${cfg.glow}` : `0 0 20px ${cfg.glow}`,
              }}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: idx === 0 ? 1.05 : 1 }}
              transition={{ delay: 0.2 + displayIdx * 0.12, duration: 0.5, type: 'spring' }}
              whileHover={{ y: -6, transition: { duration: 0.3 } }}
            >
              {/* Crown glow */}
              <div
                className="text-3xl mb-3"
                style={{ filter: `drop-shadow(0 0 8px ${cfg.glow})` }}
              >
                {medals[idx]}
              </div>
              {/* Avatar */}
              <div
                className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-xl font-bold mb-3"
                style={{
                  background: `color-mix(in srgb, ${cfg.color} 15%, transparent)`,
                  color: cfg.color,
                  border: `1px solid color-mix(in srgb, ${cfg.color} 20%, transparent)`,
                  boxShadow: `0 0 20px ${cfg.glow}`,
                }}
              >
                {u.username.charAt(0).toUpperCase()}
              </div>
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{u.username}</p>
              <p className="text-3xl font-extrabold mt-1.5 counter-value" style={{ color: cfg.color }}>{u.reputation}</p>
              <p className="text-[.65rem] font-medium mt-0.5" style={{ color: 'var(--text-tertiary)' }}>REPUTATION</p>
              <div className="mt-3">
                <ReputationBadge classification={u.classification} score={u.reputation} showScore={false} size="sm" />
              </div>
              <div className="mt-3 flex justify-center gap-4 text-[.68rem]" style={{ color: 'var(--text-tertiary)' }}>
                <span className="flex items-center gap-1"><Upload size={10} /> {u.total_uploads}</span>
                <span className="flex items-center gap-1"><Download size={10} /> {u.total_downloads}</span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Remaining rankings */}
      {rest.length > 0 && (
        <motion.div
          className="card overflow-hidden"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 60 }}>#</th>
                  <th>User</th>
                  <th>Status</th>
                  <th className="text-right">Reputation</th>
                  <th className="text-right">Uploads</th>
                  <th className="text-right">Downloads</th>
                  <th className="text-right">Avg Rating</th>
                </tr>
              </thead>
              <tbody>
                {rest.map((u, i) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 + i * 0.04 }}
                  >
                    <td className="font-mono" style={{ color: 'var(--text-tertiary)' }}>{i + 4}</td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-[.7rem] font-bold"
                          style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
                        >
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{u.username}</span>
                      </div>
                    </td>
                    <td>
                      <ReputationBadge classification={u.classification} score={u.reputation} showScore={false} size="sm" />
                    </td>
                    <td className="text-right font-mono font-bold" style={{ color: 'var(--accent)' }}>{u.reputation}</td>
                    <td className="text-right" style={{ color: 'var(--text-secondary)' }}>{u.total_uploads}</td>
                    <td className="text-right" style={{ color: 'var(--text-secondary)' }}>{u.total_downloads}</td>
                    <td className="text-right font-mono" style={{ color: 'var(--warning)' }}>
                      {u.average_rating > 0 ? (
                        <span className="flex items-center justify-end gap-1">
                          <Star size={11} fill="currentColor" /> {u.average_rating.toFixed(1)}
                        </span>
                      ) : '—'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
