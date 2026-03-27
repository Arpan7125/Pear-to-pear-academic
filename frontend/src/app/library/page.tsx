'use client';

import { useEffect, useState } from 'react';
import { Resource, LibraryStats, ResourceType } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import * as api from '@/lib/api';
import ResourceCard from '@/components/ResourceCard';
import StatCard from '@/components/StatCard';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import UploadModal from '@/components/UploadModal';
import RatingModal from '@/components/RatingModal';
import PreviewModal from '@/components/PreviewModal';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Download, Star, FolderOpen, Plus, SlidersHorizontal, CheckCircle } from 'lucide-react';

const typeFilters: { label: string; value: ResourceType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'PDF', value: 'pdf' },
  { label: 'Document', value: 'document' },
  { label: 'Presentation', value: 'presentation' },
  { label: 'Spreadsheet', value: 'spreadsheet' },
];

export default function LibraryPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<ResourceType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'downloads' | 'recent'>('rating');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [ratingTarget, setRatingTarget] = useState<Resource | null>(null);
  const [previewTarget, setPreviewTarget] = useState<Resource | null>(null);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  const handleDownload = async (r: Resource) => {
    if (!user) return;
    try {
      await api.downloadResource(r.id, user.id);
      setResources(prev => prev.map(res => res.id === r.id ? { ...res, download_count: res.download_count + 1 } : res));
      setDownloadToast(r.title || r.filename);
      setTimeout(() => setDownloadToast(null), 3000);

      // Show review popup 1 second after download starts (only if not the uploader)
      if (r.uploaded_by !== user.id) {
        setTimeout(() => setRatingTarget(r), 1000);
      }
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  useEffect(() => {
    async function load() {
      try {
        const [res, ls] = await Promise.all([api.getAllResources(), api.getLibraryStats()]);
        setResources(res.results?.map(r => r.resource) ?? []);
        setStats(ls);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = resources
    .filter(r => typeFilter === 'all' || r.type === typeFilter)
    .sort((a, b) => {
      if (sortBy === 'rating') return b.average_rating - a.average_rating;
      if (sortBy === 'downloads') return b.download_count - a.download_count;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  if (loading) return <div className="space-y-6"><LoadingSkeleton type="stat" count={4} /><LoadingSkeleton type="card" count={6} /></div>;

  const subjectEntries = stats ? Object.entries(stats.by_subject).sort((a, b) => b[1] - a[1]) : [];

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
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={18} style={{ color: 'var(--accent)' }} />
            <h1 className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Library</h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Browse and discover academic resources</p>
        </div>
        <motion.button className="btn btn-primary" onClick={() => setUploadOpen(true)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
          <Plus size={16} strokeWidth={2.5} /> Upload
        </motion.button>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <StatCard title="Total Resources" value={stats?.total_resources ?? 0} icon={<BookOpen size={20} strokeWidth={1.8} />} accent="var(--accent)" />
        <StatCard title="Total Downloads" value={stats?.total_downloads ?? 0} icon={<Download size={20} strokeWidth={1.8} />} accent="var(--info)" />
        <StatCard title="Total Ratings" value={stats?.total_ratings ?? 0} icon={<Star size={20} strokeWidth={1.8} />} accent="var(--warning)" />
        <StatCard title="Subjects" value={subjectEntries.length} icon={<FolderOpen size={20} strokeWidth={1.8} />} accent="var(--danger)" />
      </motion.div>

      {/* Filters */}
      <motion.div
        className="flex flex-wrap items-center gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <div className="flex rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}>
          {typeFilters.map(f => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300"
              style={{
                background: typeFilter === f.value ? 'var(--accent)' : 'transparent',
                color: typeFilter === f.value ? 'var(--text-inverse)' : 'var(--text-secondary)',
                boxShadow: typeFilter === f.value ? '0 0 12px rgba(6, 214, 160, 0.25)' : 'none',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} style={{ color: 'var(--text-tertiary)' }} />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="modal-input text-xs py-1.5 px-3 w-auto"
          >
            <option value="rating">By Rating</option>
            <option value="downloads">By Downloads</option>
            <option value="recent">Most Recent</option>
          </select>
        </div>
        <span className="text-xs font-medium ml-auto px-3 py-1 rounded-full" style={{ color: 'var(--accent)', background: 'var(--accent-dim)' }}>{filtered.length} resources</span>
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.div
          className="xl:col-span-2 space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {filtered.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 + i * 0.04 }}
            >
              <ResourceCard 
                resource={r} 
                onDownload={() => handleDownload(r)} 
                onPreview={() => setPreviewTarget(r)}
              />
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="card text-center py-12">
              <BookOpen size={32} className="mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No resources match your filters.</p>
            </div>
          )}
        </motion.div>

        {/* Subject breakdown */}
        <motion.div
          className="card h-fit"
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <FolderOpen size={14} style={{ color: 'var(--violet)' }} />
            By Subject
          </h3>
          <div className="space-y-3">
            {subjectEntries.map(([subj, count]) => {
              const pct = Math.round((count / (stats?.total_resources || 1)) * 100);
              return (
                <div key={subj}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="truncate mr-2 font-medium" style={{ color: 'var(--text-secondary)' }}>{subj}</span>
                    <span className="font-mono font-bold" style={{ color: 'var(--accent)' }}>{count}</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      <UploadModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} onUpload={async (data) => {
        if (!user) return;
        const created = await api.createResource(data, user.id);
        setResources(prev => [created, ...prev]);
      }} />
      <RatingModal isOpen={!!ratingTarget} resourceTitle={ratingTarget?.title ?? ''} onClose={() => setRatingTarget(null)} onRate={async (rating, comment) => {
        if (ratingTarget) {
          await api.rateResource(ratingTarget.id, rating, comment);
          setResources(prev => prev.map(r => r.id === ratingTarget.id ? { ...r, total_ratings: r.total_ratings + 1 } : r));
        }
        setRatingTarget(null);
      }} />

      {/* Download toast */}
      <PreviewModal
        isOpen={!!previewTarget}
        resource={previewTarget}
        onClose={() => setPreviewTarget(null)}
        onDownload={() => {
          if (previewTarget) handleDownload(previewTarget);
        }}
      />

      <AnimatePresence>
        {downloadToast && (
          <motion.div
            initial={{ opacity: 0, y: 40, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-6 left-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-xl shadow-lg"
              style={{ background: 'var(--bg-card-solid)', border: '1px solid var(--accent)' }}
          >
            <CheckCircle size={16} style={{ color: 'var(--accent)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>Downloaded: {downloadToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

