'use client';

import { useEffect, useState } from 'react';
import { Resource, User, NetworkStats, LibraryStats } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import * as api from '@/lib/api';
import ResourceCard from '@/components/ResourceCard';
import ReputationBadge from '@/components/ReputationBadge';
import UploadModal from '@/components/UploadModal';
import RatingModal from '@/components/RatingModal';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { Plus, Users, BookOpen, ArrowDownToLine, Star, Wifi, Trophy } from 'lucide-react';

interface AdminStats {
  total_users: number;
  total_resources: number;
  total_downloads: number;
  total_ratings: number;
  active_peers: number;
  avg_reputation: number;
}

function mergeStats(net: NetworkStats, lib: LibraryStats): AdminStats {
  return {
    total_users: net.total_users,
    total_resources: lib.total_resources,
    total_downloads: lib.total_downloads,
    total_ratings: lib.total_ratings,
    active_peers: net.total_users,
    avg_reputation: net.average_score,
  };
}

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [netStats, setNetStats] = useState<NetworkStats | null>(null);
  
  const [popularResources, setPopularResources] = useState<Resource[]>([]);
  const [recentResources, setRecentResources] = useState<Resource[]>([]);
  const [topUsers, setTopUsers] = useState<User[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [ratingTarget, setRatingTarget] = useState<Resource | null>(null);

  useEffect(() => {
    if (!user || !isAdmin) return;
    const userId = user.id;
    async function load() {
      try {
        const adminStats = await api.adminGetStats(userId);
        setStats(mergeStats(adminStats.network, adminStats.library));
        setNetStats(adminStats.network);

        const [pop, rec, users] = await Promise.all([
          api.getPopularResources(6),
          api.getRecentResources(5),
          api.getLeaderboard(5),
        ]);
        setPopularResources(pop);
        setRecentResources(rec);
        setTopUsers(users);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, isAdmin]);

  const handleUpload = async (data: Parameters<typeof api.createResource>[0]) => {
    if (!user) return;
    const created = await api.createResource(data, user.id);
    setRecentResources(prev => [created, ...prev].slice(0, 5));
  };

  const handleDownload = async (r: Resource) => { if (!user) return; await api.downloadResource(r.id, user.id); if (r.uploaded_by !== user.id) { setRatingTarget(r); } };

  const handleRate = async (rating: number, comment: string) => {
    if (!ratingTarget) return;
    await api.rateResource(ratingTarget.id, rating, comment);
    setRatingTarget(null);
  };

  if (!isAdmin) {
    return (
      <div className="card text-center py-16">
        <p className="font-semibold" style={{ color: 'var(--danger)' }}>Access Denied</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Admin privileges required.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card animate-pulse h-24" />
        ))}
      </div>
    );
  }

  const cards = [
    { label: 'Total Users', value: stats?.total_users ?? 0, color: 'var(--accent)', icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-1.053M18 8.625a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM8.25 6.75a3 3 0 11-6 0 3 3 0 016 0z' },
    { label: 'Total Resources', value: stats?.total_resources ?? 0, color: '#118ab2', icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25' },
    { label: 'Downloads', value: stats?.total_downloads ?? 0, color: 'var(--warning)', icon: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3' },
    { label: 'Total Ratings', value: stats?.total_ratings ?? 0, color: '#ef476f', icon: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z' },
    { label: 'Active Peers', value: stats?.active_peers ?? 0, color: '#73d2de', icon: 'M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z' },
    { label: 'Avg Reputation', value: (stats?.avg_reputation ?? 0).toFixed(1), color: 'var(--accent)', icon: 'M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-4.5A3.375 3.375 0 0013.125 10.875h-2.25A3.375 3.375 0 007.5 14.25v4.5m6-15h.008v.008H13.5V3.75zm-4.5 0h.008v.008H9V3.75z' },
  ];

  const iconMap: Record<string, React.ElementType> = {
    'Total Users': Users, 'Total Resources': BookOpen, 'Downloads': ArrowDownToLine,
    'Total Ratings': Star, 'Active Peers': Wifi, 'Avg Reputation': Trophy,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        className="flex items-end justify-between"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Admin Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Network overview & management</p>
        </div>
        <button className="btn btn-primary" onClick={() => setUploadOpen(true)}>
          <Plus size={16} />
          Upload
        </button>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
        {cards.map(c => {
          const Icon = iconMap[c.label] || Users;
          return (
            <div key={c.label} className="stat-card group">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{c.label}</p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in srgb, ${c.color} 12%, transparent)` }}>
                  <Icon size={16} style={{ color: c.color }} />
                </div>
              </div>
              <p className="text-3xl font-bold" style={{ color: c.color }}>{c.value}</p>
            </div>
          );
        })}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger-children">
        <a href="/admin/users" className="card group cursor-pointer">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}><Users size={15} style={{ color: 'var(--accent)' }} /></div>
            <h3 className="font-semibold text-sm group-hover:text-[var(--accent)] transition-colors" style={{ color: 'var(--text-primary)' }}>Manage Users</h3>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>View, update roles, or remove users</p>
        </a>
        <a href="/admin/resources" className="card group cursor-pointer">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--violet-dim)' }}><BookOpen size={15} style={{ color: 'var(--violet)' }} /></div>
            <h3 className="font-semibold text-sm group-hover:text-[var(--accent)] transition-colors" style={{ color: 'var(--text-primary)' }}>Manage Resources</h3>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Review and moderate shared resources</p>
        </a>
        <a href="/admin/stats" className="card group cursor-pointer">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--info-dim)' }}><Trophy size={15} style={{ color: 'var(--info)' }} /></div>
            <h3 className="font-semibold text-sm group-hover:text-[var(--accent)] transition-colors" style={{ color: 'var(--text-primary)' }}>Network Statistics</h3>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Detailed analytics and network health</p>
        </a>
      </div>

      {/* Main grid: Popular + sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Popular resources */}
        <div className="xl:col-span-2">
          <h2 className="section-title">Popular Resources</h2>
          <div className="space-y-3">
            {popularResources.map(r => (
              <ResourceCard key={r.id} resource={r} onDownload={() => handleDownload(r)} />
            ))}
            {popularResources.length === 0 && <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No resources yet.</p>}
          </div>
        </div>

        {/* Sidebar cards */}
        <div className="space-y-6">
          {/* Network classification */}
          <div className="card text-center sm:text-left">
            <h3 className="font-semibold mb-4 text-sm" style={{ color: 'var(--text-primary)' }}>Network Composition</h3>
            <div className="h-48 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Contributors', value: netStats?.contributors || 0 },
                      { name: 'Neutral', value: netStats?.neutral || 1 },
                      { name: 'Leechers', value: netStats?.leechers || 0 },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {['#06d6a0', '#f59e0b', '#ef4444'].map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(14,20,35,0.95)', backdropFilter: 'blur(12px)', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }} 
                    itemStyle={{ color: '#e8ecf4', fontWeight: 600, fontSize: '0.8rem' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top contributors */}
          <div className="card">
            <h3 className="font-semibold mb-4 text-sm" style={{ color: 'var(--text-primary)' }}>Top Contributors</h3>
            <div className="space-y-3">
              {topUsers.map((u, i) => (
                <motion.div key={u.id} className="flex items-center gap-3" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                  <span className="w-5 text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>#{i + 1}</span>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                    {u.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{u.username}</p>
                  </div>
                  <ReputationBadge classification={u.classification} score={u.reputation} size="sm" />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div className="card">
            <h3 className="font-semibold mb-4 text-sm" style={{ color: 'var(--text-primary)' }}>Recent Uploads</h3>
            <div className="space-y-2.5">
              {recentResources.slice(0, 4).map(r => (
                <div key={r.id} className="flex items-center gap-3">
                  <div className="status-dot online" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{r.title || r.filename}</p>
                    <p className="text-[.68rem]" style={{ color: 'var(--text-tertiary)' }}>{r.subject}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <UploadModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} onUpload={handleUpload} />
      <RatingModal isOpen={!!ratingTarget} resourceTitle={ratingTarget?.title ?? ''} onClose={() => setRatingTarget(null)} onRate={handleRate} />
    </div>
  );
}


