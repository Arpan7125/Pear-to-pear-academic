'use client';

import { useEffect, useState } from 'react';
import { NetworkStats, LibraryStats } from '@/lib/types';
import * as api from '@/lib/api';
import StatCard from '@/components/StatCard';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { motion } from 'framer-motion';
import { BarChart3, Users, FileText, Download, Activity } from 'lucide-react';

export default function AnalyticsPage() {
  const [netStats, setNetStats] = useState<NetworkStats | null>(null);
  const [libStats, setLibStats] = useState<LibraryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getNetworkStats(), api.getLibraryStats()])
      .then(([ns, ls]) => { setNetStats(ns); setLibStats(ls); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-6"><LoadingSkeleton type="stat" count={4} /><LoadingSkeleton type="card" count={3} /></div>;

  const subjectEntries = libStats ? Object.entries(libStats.by_subject).sort((a, b) => b[1] - a[1]) : [];
  const typeEntries = libStats ? Object.entries(libStats.by_type).sort((a, b) => b[1] - a[1]) : [];
  const maxSubjCount = subjectEntries.length > 0 ? subjectEntries[0][1] : 1;
  const maxTypeCount = typeEntries.length > 0 ? typeEntries[0][1] : 1;

  const typeColors: Record<string, string> = {
    pdf: '#ef476f', document: '#118ab2', presentation: '#ffd166', spreadsheet: '#06d6a0', other: '#8b90a0',
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 size={18} style={{ color: 'var(--accent)' }} />
          <h1 className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Analytics</h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Network and library insights</p>
      </motion.div>

      {/* KPI row */}
      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <StatCard title="Total Users" value={netStats?.total_users ?? 0} icon={<Users size={20} strokeWidth={1.8} />} accent="var(--accent)" />
        <StatCard title="Resources" value={libStats?.total_resources ?? 0} icon={<FileText size={20} strokeWidth={1.8} />} accent="#118ab2" />
        <StatCard title="Downloads" value={libStats?.total_downloads ?? 0} icon={<Download size={20} strokeWidth={1.8} />} accent="var(--warning)" />
        <StatCard title="Avg Score" value={netStats?.average_score?.toFixed(1) ?? '0'} icon={<Activity size={20} strokeWidth={1.8} />} accent="var(--danger)" />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Network composition donut */}
        <motion.div className="card" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="font-semibold text-sm mb-5 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Users size={14} style={{ color: 'var(--violet)' }} />
            User Classification
          </h3>
          <div className="flex items-center gap-8">
            <div className="relative w-32 h-32 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                {(() => {
                  const total = netStats?.total_users || 1;
                  const segments = [
                    { count: netStats?.contributors ?? 0, color: 'var(--accent)' },
                    { count: netStats?.neutral ?? 0, color: 'var(--warning)' },
                    { count: netStats?.leechers ?? 0, color: 'var(--danger)' },
                  ];
                  let offset = 0;
                  return segments.map((seg, i) => {
                    const pct = (seg.count / total) * 100;
                    const el = (
                      <circle key={i} cx="18" cy="18" r="16" fill="none" stroke={seg.color} strokeWidth="3"
                        strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={-offset} strokeLinecap="round" />
                    );
                    offset += pct;
                    return el;
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{netStats?.total_users ?? 0}</span>
                <span className="text-[.6rem]" style={{ color: 'var(--text-tertiary)' }}>users</span>
              </div>
            </div>
            <div className="space-y-3 flex-1">
              {[
                { label: 'Contributors', count: netStats?.contributors ?? 0, color: 'var(--accent)' },
                { label: 'Neutral', count: netStats?.neutral ?? 0, color: 'var(--warning)' },
                { label: 'Leechers', count: netStats?.leechers ?? 0, color: 'var(--danger)' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                  </div>
                  <span className="font-mono text-sm font-semibold" style={{ color: item.color }}>
                    {item.count}
                    <span className="text-[.68rem] ml-1" style={{ color: 'var(--text-tertiary)' }}>
                      ({netStats ? Math.round((item.count / (netStats.total_users || 1)) * 100) : 0}%)
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Resource types */}
        <motion.div className="card" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
          <h3 className="font-semibold text-sm mb-5 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <FileText size={14} style={{ color: 'var(--violet)' }} />
            Resource Types
          </h3>
          <div className="space-y-4">
            {typeEntries.map(([type, count], i) => {
              const pct = Math.round((count / maxTypeCount) * 100);
              return (
                <motion.div key={type} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.06 }}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="uppercase tracking-wider font-medium" style={{ color: 'var(--text-secondary)' }}>{type}</span>
                    <span className="font-mono font-semibold" style={{ color: typeColors[type] || '#8b90a0' }}>{count}</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: typeColors[type] || '#8b90a0' }} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Subject heatmap */}
      <motion.div className="card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <h3 className="font-semibold text-sm mb-5 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <BarChart3 size={14} style={{ color: 'var(--violet)' }} />
          Subject Distribution
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {subjectEntries.map(([subj, count], i) => {
            const intensity = count / maxSubjCount;
            return (
              <motion.div
                key={subj}
                className="rounded-xl p-4 text-center transition-transform"
                style={{
                  background: `color-mix(in srgb, var(--accent) ${Math.max(5, Math.round(intensity * 30))}%, var(--bg-card-solid))`,
                  border: '1px solid var(--border-subtle)',
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                whileHover={{ scale: 1.06, y: -3 }}
              >
                <p className="text-lg font-bold" style={{ color: 'var(--accent)' }}>{count}</p>
                <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-secondary)' }}>{subj}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
