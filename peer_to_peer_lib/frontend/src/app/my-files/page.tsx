'use client';

import { useEffect, useState } from 'react';
import { Resource } from '@/lib/types';
import * as api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import ResourceCard from '@/components/ResourceCard';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import UploadModal from '@/components/UploadModal';
import RatingModal from '@/components/RatingModal';
import { FolderOpen, Upload, FileText, HardDrive } from 'lucide-react';

export default function MyFilesPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [ratingTarget, setRatingTarget] = useState<Resource | null>(null);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const res = await api.getUserResources(user!.id);
        setResources(res);
      } catch (e) {
        console.error('Failed to load user resources:', e);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  const handleUpload = async (data: Parameters<typeof api.createResource>[0]) => {
    if (!user) return;
    const created = await api.createResource(data, user.id);
    setResources(prev => [created, ...prev]);
  };

  const handleDownload = async (r: Resource) => {
    if (!user) return;
    await api.downloadResource(r.id, user.id);
    setRatingTarget(r);
  };

  const handleRate = async (rating: number, comment: string) => {
    if (!ratingTarget) return;
    await api.rateResource(ratingTarget.id, rating, comment);
    setRatingTarget(null);
  };

  const totalSize = resources.reduce((sum, r) => sum + (r.size || 0), 0);
  const totalDownloads = resources.reduce((sum, r) => sum + (r.download_count || 0), 0);

  if (loading) {
    return (
      <div className="space-y-8">
        <LoadingSkeleton type="stat" count={3} />
        <LoadingSkeleton type="card" count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-8 stagger-children">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Files</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Manage your uploaded academic resources
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setUploadOpen(true)}>
          <Upload size={16} className="inline -mt-0.5" />
          Upload New
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-[var(--text-secondary)]">Total Files</p>
            <FileText size={20} className="text-[var(--accent)]" />
          </div>
          <p className="text-3xl font-bold text-[var(--accent)]">{resources.length}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-[var(--text-secondary)]">Total Size</p>
            <HardDrive size={20} className="text-[#118ab2]" />
          </div>
          <p className="text-3xl font-bold text-[#118ab2]">
            {totalSize > 1048576 ? `${(totalSize / 1048576).toFixed(1)} MB` : `${(totalSize / 1024).toFixed(0)} KB`}
          </p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-[var(--text-secondary)]">Total Downloads</p>
            <FolderOpen size={20} className="text-[var(--warning)]" />
          </div>
          <p className="text-3xl font-bold text-[var(--warning)]">{totalDownloads}</p>
        </div>
      </div>

      {/* File List */}
      {resources.length > 0 ? (
        <div>
          <h2 className="section-title mb-4">Your Uploaded Resources</h2>
          <div className="space-y-3">
            {resources.map(r => (
              <ResourceCard key={r.id} resource={r} onDownload={() => handleDownload(r)} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 card border-dashed border-2">
          <FolderOpen size={48} className="mx-auto mb-4 text-[var(--text-tertiary)] opacity-30" />
          <h3 className="font-semibold text-[var(--text-primary)] mb-1">No files uploaded yet</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            Start sharing academic resources with the P2P network
          </p>
          <button className="btn btn-primary" onClick={() => setUploadOpen(true)}>
            <Upload size={16} className="inline -mt-0.5" />
            Upload Your First File
          </button>
        </div>
      )}

      {/* Modals */}
      <UploadModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} onUpload={handleUpload} />
      <RatingModal isOpen={!!ratingTarget} resourceTitle={ratingTarget?.title ?? ''} onClose={() => setRatingTarget(null)} onRate={handleRate} />
    </div>
  );
}
