'use client';

import { useEffect, useState } from 'react';
import { Resource } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import * as api from '@/lib/api';
import ResourceCard from '@/components/ResourceCard';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import RatingModal from '@/components/RatingModal';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, Upload, Download, Star, CheckCircle } from 'lucide-react';

export default function MyFilesPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingTarget, setRatingTarget] = useState<Resource | null>(null);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  const handleDownload = async (r: Resource) => {
    if (!user) return;
    try {
      await api.downloadResource(r.id, user.id);
      setResources(prev => prev.map(res => res.id === r.id ? { ...res, download_count: res.download_count + 1 } : res));
      setDownloadToast(r.title || r.filename);
      setTimeout(() => setDownloadToast(null), 3000);
      setRatingTarget(r);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  useEffect(() => {
    if (!user) return;
    api.getUserResources(user.id)
      .then(setResources)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <LoadingSkeleton type="card" count={5} />;

  const totalDownloads = resources.reduce((s, r) => s + r.download_count, 0);
  const avgRating = resources.length
    ? (resources.reduce((s, r) => s + r.average_rating, 0) / resources.length).toFixed(1)
    : '0.0';

  const statItems = [
    { label: 'My Uploads', value: resources.length, icon: Upload, color: 'var(--accent)' },
    { label: 'Total Downloads', value: totalDownloads, icon: Download, color: 'var(--info)' },
    { label: 'Avg Rating', value: avgRating, icon: Star, color: 'var(--warning)' },
  ];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>My Files</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Resources you have uploaded to the network</p>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger-children">
        {statItems.map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s.label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in srgb, ${s.color} 12%, transparent)` }}>
                <s.icon size={16} style={{ color: s.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Resource list */}
      <div className="space-y-3 stagger-children">
        {resources.map(r => (
          <ResourceCard key={r.id} resource={r} onDownload={() => handleDownload(r)} />
        ))}
        {resources.length === 0 && (
          <motion.div
            className="card text-center py-16"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}>
              <FolderOpen size={36} style={{ color: 'var(--text-tertiary)', opacity: 0.4 }} />
            </div>
            <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>You haven&apos;t uploaded any files yet.</p>
            <p className="text-xs mb-5" style={{ color: 'var(--text-tertiary)' }}>Share your first resource to start building reputation.</p>
            <a href="/upload" className="btn btn-primary inline-flex items-center gap-2">
              <Upload size={16} />
              Upload Your First Resource
            </a>
          </motion.div>
        )}
      </div>

      <RatingModal
        isOpen={!!ratingTarget}
        resourceTitle={ratingTarget?.title ?? ''}
        onClose={() => setRatingTarget(null)}
        onRate={async (rating, comment) => {
          if (ratingTarget) {
            await api.rateResource(ratingTarget.id, rating, comment);
            setResources(prev => prev.map(r => r.id === ratingTarget.id ? { ...r, total_ratings: r.total_ratings + 1 } : r));
          }
          setRatingTarget(null);
        }}
      />

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
