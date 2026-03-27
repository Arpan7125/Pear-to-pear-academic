'use client';

import { useEffect, useState } from 'react';
import { User, Resource } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import * as api from '@/lib/api';
import { motion } from 'framer-motion';

export default function NetworkStatsPage() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getUsers(), api.getResources()])
      .then(([u, r]) => { setUsers(u); setResources(r); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (!isAdmin) {
    return (
      <div className="card text-center py-16">
        <p className="text-[var(--danger)] font-semibold">Access Denied</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => <div key={i} className="card animate-pulse h-24" />)}
      </div>
    );
  }

  // Compute analytics locally
  const totalDownloads = resources.reduce((s, r) => s + r.download_count, 0);
  const totalRatings = resources.reduce((s, r) => s + r.total_ratings, 0);
  const avgRating = resources.length
    ? (resources.reduce((s, r) => s + r.average_rating, 0) / resources.length).toFixed(2)
    : '0.00';
  const avgReputation = users.length
    ? (users.reduce((s, u) => s + u.reputation, 0) / users.length).toFixed(1)
    : '0.0';
  const contributors = users.filter(u => u.classification === 'Contributor').length;
  const leechers = users.filter(u => u.classification === 'Leecher').length;
  const neutral = users.length - contributors - leechers;

  // Subject distribution
  const subjectMap: Record<string, number> = {};
  resources.forEach(r => { subjectMap[r.subject] = (subjectMap[r.subject] || 0) + 1; });
  const subjects = Object.entries(subjectMap).sort((a, b) => b[1] - a[1]);

  // Top uploaders
  const uploaderMap: Record<string, number> = {};
  resources.forEach(r => { uploaderMap[r.uploaded_by] = (uploaderMap[r.uploaded_by] || 0) + 1; });
  const topUploaders = Object.entries(uploaderMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const uploaderNames: Record<string, string> = {};
  users.forEach(u => { uploaderNames[u.id] = u.username; });

  const classColors: Record<string, string> = {
    Contributor: 'var(--accent)',
    Leecher: 'var(--danger)',
    Neutral: 'var(--warning)',
  };

  const classifications = [
    { label: 'Contributors', count: contributors, color: classColors.Contributor },
    { label: 'Neutral', count: neutral, color: classColors.Neutral },
    { label: 'Leechers', count: leechers, color: classColors.Leecher },
  ];

  const maxSubjectCount = subjects.length ? subjects[0][1] : 1;

  return (
    <div className="space-y-8 stagger-children">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Network Statistics</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Detailed analytics &amp; health metrics</p>
      </motion.div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Users', value: users.length, color: 'var(--accent)' },
          { label: 'Resources', value: resources.length, color: '#118ab2' },
          { label: 'Downloads', value: totalDownloads, color: 'var(--warning)' },
          { label: 'Ratings', value: totalRatings, color: '#ef476f' },
        ].map(k => (
          <div key={k.label} className="stat-card">
            <p className="text-xs text-[var(--text-secondary)] mb-1">{k.label}</p>
            <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User classification */}
        <div className="card">
          <h3 className="font-semibold text-sm text-[var(--text-primary)] mb-4">User Classification</h3>
          <div className="flex items-center gap-6 mb-5">
            {/* Donut */}
            <svg width="110" height="110" viewBox="0 0 36 36" className="flex-shrink-0">
              {(() => {
                const total = users.length || 1;
                let offset = 0;
                return classifications.map(c => {
                  const pct = (c.count / total) * 100;
                  const el = (
                    <circle key={c.label} cx="18" cy="18" r="15.915" fill="none"
                      stroke={c.color} strokeWidth="3" strokeDasharray={`${pct} ${100 - pct}`}
                      strokeDashoffset={-offset} strokeLinecap="round" style={{ opacity: 0.85 }} />
                  );
                  offset += pct;
                  return el;
                });
              })()}
              <text x="18" y="17" textAnchor="middle" className="text-[5px] font-bold fill-[var(--text-primary)]">{users.length}</text>
              <text x="18" y="22" textAnchor="middle" className="text-[3px] fill-[var(--text-tertiary)]">users</text>
            </svg>
            <div className="space-y-2 flex-1">
              {classifications.map(c => (
                <div key={c.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                    <span className="text-xs text-[var(--text-secondary)]">{c.label}</span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-[var(--text-primary)]">{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Subject Distribution */}
        <div className="card">
          <h3 className="font-semibold text-sm text-[var(--text-primary)] mb-4">Subject Distribution</h3>
          <div className="space-y-3">
            {subjects.map(([subj, count]) => (
              <div key={subj}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--text-secondary)]">{subj}</span>
                  <span className="font-mono text-[var(--text-primary)]">{count}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[#118ab2]"
                    style={{ width: `${(count / maxSubjectCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quality Metrics */}
        <div className="card">
          <h3 className="font-semibold text-sm text-[var(--text-primary)] mb-4">Quality Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-[var(--text-secondary)]">Average Rating</span>
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" fill="var(--warning)" viewBox="0 0 24 24"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/></svg>
                <span className="font-mono font-semibold text-[var(--warning)]">{avgRating}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-[var(--text-secondary)]">Average Reputation</span>
              <span className="font-mono font-semibold text-[var(--accent)]">{avgReputation}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-[var(--text-secondary)]">Downloads / Resource</span>
              <span className="font-mono font-semibold text-[#118ab2]">{resources.length ? (totalDownloads / resources.length).toFixed(1) : '0'}</span>
            </div>
          </div>
        </div>

        {/* Top Uploaders */}
        <div className="card">
          <h3 className="font-semibold text-sm text-[var(--text-primary)] mb-4">Top Uploaders</h3>
          <div className="space-y-3">
            {topUploaders.map(([uid, count], i) => (
              <div key={uid} className="flex items-center gap-3">
                <span className={`text-xs font-bold w-5 ${i === 0 ? 'text-[var(--warning)]' : 'text-[var(--text-tertiary)]'}`}>#{i + 1}</span>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-[rgba(6,214,160,.12)] text-[var(--accent)]">
                  {(uploaderNames[uid] || '?').charAt(0).toUpperCase()}
                </div>
                <span className="text-xs text-[var(--text-primary)] flex-1">{uploaderNames[uid] || uid.slice(0, 8)}</span>
                <span className="font-mono text-xs text-[var(--accent)]">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
