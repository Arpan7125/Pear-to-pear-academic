'use client';

import { useEffect, useState } from 'react';
import { Resource } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import * as api from '@/lib/api';
import { motion } from 'framer-motion';

export default function ManageResourcesPage() {
  const { user: me, isAdmin } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.getResources()
      .then(setResources)
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

  const deleteResource = async (id: string) => {
    if (!me) return;
    if (!confirm('Delete this resource permanently?')) return;
    setActionLoading(id);
    try {
      await api.adminDeleteResource(id, me.id);
      setResources(prev => prev.filter(r => r.id !== id));
    } catch (e) { console.error(e); }
    setActionLoading(null);
  };

  const filtered = resources.filter(r =>
    !filter || r.title.toLowerCase().includes(filter.toLowerCase()) ||
    r.subject.toLowerCase().includes(filter.toLowerCase())
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => <div key={i} className="card animate-pulse h-16" />)}
      </div>
    );
  }

  return (
    <div className="space-y-8 stagger-children">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Manage Resources</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{resources.length} total resources</p>
        </motion.div>
        <input
          type="text"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter by title or subject…"
          className="modal-input max-w-xs"
        />
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              <th className="text-left text-xs font-medium text-[var(--text-secondary)] px-5 py-3">Resource</th>
              <th className="text-left text-xs font-medium text-[var(--text-secondary)] px-5 py-3">Subject</th>
              <th className="text-left text-xs font-medium text-[var(--text-secondary)] px-5 py-3">Size</th>
              <th className="text-left text-xs font-medium text-[var(--text-secondary)] px-5 py-3">Rating</th>
              <th className="text-left text-xs font-medium text-[var(--text-secondary)] px-5 py-3">Downloads</th>
              <th className="text-right text-xs font-medium text-[var(--text-secondary)] px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[rgba(6,214,160,0.03)] transition-colors">
                <td className="px-5 py-3.5">
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">{r.title}</p>
                    <p className="text-[10px] text-[var(--text-tertiary)] font-mono">{r.filename}</p>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-[rgba(6,214,160,.08)] text-[var(--accent)]">{r.subject}</span>
                </td>
                <td className="px-5 py-3.5 font-mono text-xs text-[var(--text-secondary)]">{formatSize(r.size)}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1">
                    <svg width="12" height="12" fill="var(--warning)" viewBox="0 0 24 24"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/></svg>
                    <span className="text-xs font-mono text-[var(--warning)]">{r.average_rating.toFixed(1)}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 font-mono text-xs text-[var(--text-primary)]">{r.download_count}</td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    onClick={() => deleteResource(r.id)}
                    disabled={actionLoading === r.id}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-[rgba(239,71,111,.08)] text-[var(--danger)] hover:bg-[rgba(239,71,111,.16)] transition-colors"
                  >
                    {actionLoading === r.id ? 'Deleting…' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-[var(--text-secondary)] py-10 text-sm">
                  No resources match your filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
