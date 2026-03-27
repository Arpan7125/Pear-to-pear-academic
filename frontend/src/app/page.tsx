'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Resource, User, NetworkStats, LibraryStats } from '@/lib/types';
import * as api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import StatCard from '@/components/StatCard';
import ResourceCard from '@/components/ResourceCard';
import ReputationBadge from '@/components/ReputationBadge';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import UploadModal from '@/components/UploadModal';
import RatingModal from '@/components/RatingModal';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Users, FileText, Download, Star, Plus, Activity, TrendingUp, Clock, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const { user: currentUser, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect non-admin users to their profile
  useEffect(() => {
    if (!authLoading && currentUser && !isAdmin) {
      router.replace('/profile');
    }
  }, [authLoading, currentUser, isAdmin, router]);
  const [popularResources, setPopularResources] = useState<Resource[]>([]);
  const [recentResources, setRecentResources] = useState<Resource[]>([]);
  const [topUsers, setTopUsers] = useState<User[]>([]);
  const [netStats, setNetStats] = useState<NetworkStats | null>(null);
  const [libStats, setLibStats] = useState<LibraryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [ratingTarget, setRatingTarget] = useState<Resource | null>(null);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [pop, rec, users, ns, ls] = await Promise.all([
          api.getPopularResources(6),
          api.getRecentResources(5),
          api.getLeaderboard(5),
          api.getNetworkStats(),
          api.getLibraryStats(),
        ]);
        setPopularResources(pop);
        setRecentResources(rec);
        setTopUsers(users);
        setNetStats(ns);
        setLibStats(ls);
      } catch (e) { console.error('Dashboard load:', e); }
      setLoading(false);
    }
    load();
  }, []);

  const handleUpload = async (data: Parameters<typeof api.createResource>[0]) => {
    if (!currentUser) return;
    const created = await api.createResource(data, currentUser.id);
    setRecentResources(prev => [created, ...prev].slice(0, 5));
  };

  const handleDownload = async (r: Resource) => {
    if (!currentUser) return;
    try {
      await api.downloadResource(r.id, currentUser.id);
      setDownloadToast(r.title || r.filename);
      setTimeout(() => setDownloadToast(null), 3000);
      // Show review popup 1 second after download (only if not the uploader)
      if (r.uploaded_by !== currentUser.id) {
        setTimeout(() => setRatingTarget(r), 1000);
      }
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleRate = async (rating: number, comment: string) => {
    if (!ratingTarget) return;
    await api.rateResource(ratingTarget.id, rating, comment);
    setRatingTarget(null);
  };

  if (loading) {
    return (
      <div className="space-y-8 stagger-children">
        <LoadingSkeleton type="stat" count={4} />
        <LoadingSkeleton type="card" count={4} />
      </div>
    );
  }

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 18 ? 'Good afternoon' : 'Good evening';

  const pieData = [
    { name: 'Contributors', value: netStats?.contributors || 0, color: '#06d6a0' },
    { name: 'Neutral', value: netStats?.neutral || 1, color: '#fbbf24' },
    { name: 'Leechers', value: netStats?.leechers || 0, color: '#f43f5e' },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <motion.div
        className="flex items-end justify-between"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--accent)' }}>{greeting} 👋</p>
          <h1 className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Welcome back, <span style={{ color: 'var(--accent)' }}>{currentUser?.username}</span>
          </h1>
          <p className="text-sm mt-1.5" style={{ color: 'var(--text-secondary)' }}>
            Here&apos;s what&apos;s happening across the network today
          </p>
        </div>
        <motion.button
          className="btn btn-primary"
          onClick={() => setUploadOpen(true)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          <Plus size={16} strokeWidth={2.5} />
          Upload Resource
        </motion.button>
      </motion.div>

      {/* Stat row */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <StatCard title="Total Users" value={netStats?.total_users ?? 0} icon={<Users size={22} strokeWidth={1.8} />} accent="var(--accent)" trend={{ value: 12, isPositive: true }} />
        <StatCard title="Resources" value={libStats?.total_resources ?? 0} icon={<FileText size={22} strokeWidth={1.8} />} accent="var(--info)" trend={{ value: 8, isPositive: true }} />
        <StatCard title="Downloads" value={libStats?.total_downloads ?? 0} icon={<Download size={22} strokeWidth={1.8} />} accent="var(--warning)" trend={{ value: 24, isPositive: true }} />
        <StatCard title="Ratings" value={libStats?.total_ratings ?? 0} icon={<Star size={22} strokeWidth={1.8} />} accent="var(--danger)" />
      </motion.div>

      {/* Main grid: Popular + sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Popular resources ── 2/3 width */}
        <motion.div
          className="xl:col-span-2 space-y-4"
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} style={{ color: 'var(--accent)' }} />
            <h2 className="section-title" style={{ marginBottom: 0 }}>POPULAR RESOURCES</h2>
          </div>
          <div className="space-y-3">
            {popularResources.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.06 }}
              >
                <ResourceCard resource={r} onDownload={() => handleDownload(r)} onPreview={() => { /* Not implemented on dashboard to keep simple */ }} />
              </motion.div>
            ))}
            {popularResources.length === 0 && (
              <div className="card text-center py-12">
                <FileText size={32} className="mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No resources yet. Be the first to upload!</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Sidebar cards ── 1/3 width */}
        <motion.div
          className="space-y-5"
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* Network classification donut */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={14} style={{ color: 'var(--accent)' }} />
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Network Composition</h3>
            </div>
            <div className="h-48 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={78}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                    animationBegin={200}
                    animationDuration={1000}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid var(--border-mid)',
                      background: 'var(--bg-card-solid)',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
                    }}
                    itemStyle={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{netStats?.total_users ?? 0}</p>
                  <p className="text-[.65rem] font-medium" style={{ color: 'var(--text-tertiary)' }}>TOTAL</p>
                </div>
              </div>
            </div>
            {/* Legend */}
            <div className="flex justify-center gap-5 mt-2">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-[.7rem] font-medium" style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top contributors */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Star size={14} style={{ color: 'var(--warning)' }} />
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Top Contributors</h3>
            </div>
            <div className="space-y-3">
              {topUsers.map((u, i) => (
                <motion.div
                  key={u.id}
                  className="flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-[rgba(255,255,255,0.02)]"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.08 }}
                >
                  <span
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-[.65rem] font-bold"
                    style={{
                      background: i === 0 ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255,255,255,0.04)',
                      color: i === 0 ? '#fbbf24' : 'var(--text-tertiary)',
                    }}
                  >
                    {i + 1}
                  </span>
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold"
                    style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
                  >
                    {u.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{u.username}</p>
                  </div>
                  <ReputationBadge classification={u.classification} score={u.reputation} size="sm" />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={14} style={{ color: 'var(--info)' }} />
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Recent Uploads</h3>
            </div>
            <div className="space-y-2.5">
              {recentResources.slice(0, 5).map((r, i) => (
                <motion.div
                  key={r.id}
                  className="flex items-center gap-3 p-2 rounded-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.08 }}
                >
                  <div className="status-dot online" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{r.title || r.filename}</p>
                    <p className="text-[.68rem]" style={{ color: 'var(--text-tertiary)' }}>{r.subject}</p>
                  </div>
                  <span className="tag">{r.type}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      <UploadModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} onUpload={handleUpload} />
      <RatingModal isOpen={!!ratingTarget} resourceTitle={ratingTarget?.title ?? ''} onClose={() => setRatingTarget(null)} onRate={handleRate} />

      {/* Download toast */}
      <AnimatePresence>
        {downloadToast && (
          <motion.div
            initial={{ opacity: 0, y: 40, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-6 left-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-xl shadow-lg"
            style={{ background: 'rgba(6,214,160,0.15)', border: '1px solid rgba(6,214,160,0.3)', backdropFilter: 'blur(12px)' }}
          >
            <CheckCircle size={16} style={{ color: 'var(--accent)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>Downloaded: {downloadToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

