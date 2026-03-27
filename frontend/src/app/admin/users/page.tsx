'use client';

import { useEffect, useState } from 'react';
import { User } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import * as api from '@/lib/api';
import { motion } from 'framer-motion';
import { Users, Shield, Trash2 } from 'lucide-react';

export default function ManageUsersPage() {
  const { user: me, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = () => {
    api.getUsers()
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (!isAdmin) {
    return (
      <div className="card text-center py-16">
        <p className="text-[var(--danger)] font-semibold">Access Denied</p>
      </div>
    );
  }

  const toggleRole = async (u: User) => {
    if (!me) return;
    setActionLoading(u.id);
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    try {
      await api.adminUpdateRole(u.id, newRole, me.id);
      setUsers(prev => prev.map(p => p.id === u.id ? { ...p, role: newRole as 'admin' | 'user' } : p));
    } catch (e) { console.error(e); }
    setActionLoading(null);
  };

  const deleteUser = async (id: string) => {
    if (!me || id === me.id) return;
    if (!confirm('Delete this user permanently?')) return;
    setActionLoading(id);
    try {
      await api.adminDeleteUser(id, me.id);
      setUsers(prev => prev.filter(p => p.id !== id));
    } catch (e) { console.error(e); }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => <div key={i} className="card animate-pulse h-16" />)}
      </div>
    );
  }

  return (
    <div className="space-y-8 stagger-children">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Manage Users</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{users.length} registered users</p>
      </motion.div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              <th className="text-left text-xs font-medium text-[var(--text-secondary)] px-5 py-3">User</th>
              <th className="text-left text-xs font-medium text-[var(--text-secondary)] px-5 py-3">Role</th>
              <th className="text-left text-xs font-medium text-[var(--text-secondary)] px-5 py-3">Reputation</th>
              <th className="text-left text-xs font-medium text-[var(--text-secondary)] px-5 py-3">Class</th>
              <th className="text-left text-xs font-medium text-[var(--text-secondary)] px-5 py-3">Uploads</th>
              <th className="text-right text-xs font-medium text-[var(--text-secondary)] px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[rgba(6,214,160,0.03)] transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: u.role === 'admin' ? 'rgba(6,214,160,.15)' : 'rgba(255,209,102,.1)', color: u.role === 'admin' ? 'var(--accent)' : 'var(--warning)' }}>
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{u.username}</p>
                      <p className="text-[10px] text-[var(--text-tertiary)] font-mono">{u.id.slice(0, 8)}…</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                    u.role === 'admin' ? 'bg-[rgba(6,214,160,.12)] text-[var(--accent)]' : 'bg-[rgba(255,209,102,.1)] text-[var(--warning)]'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-mono text-[var(--accent)]">{u.reputation.toFixed(1)}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-medium ${
                    u.classification === 'Contributor' ? 'text-[var(--accent)]' :
                    u.classification === 'Leecher' ? 'text-[var(--danger)]' : 'text-[var(--warning)]'
                  }`}>{u.classification}</span>
                </td>
                <td className="px-5 py-3.5 font-mono text-[var(--text-primary)]">{u.total_uploads}</td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => toggleRole(u)}
                      disabled={actionLoading === u.id}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors" style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                      {u.role === 'admin' ? 'Demote' : 'Promote'}
                    </button>
                    {u.id !== me?.id && (
                      <button
                        onClick={() => deleteUser(u.id)}
                        disabled={actionLoading === u.id}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-[rgba(239,71,111,.08)] text-[var(--danger)] hover:bg-[rgba(239,71,111,.16)] transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
