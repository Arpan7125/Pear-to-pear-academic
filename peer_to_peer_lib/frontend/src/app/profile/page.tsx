'use client';

import { useEffect, useState } from 'react';
import { Resource, User, ReputationInfo } from '@/lib/types';
import * as api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import ResourceCard from '@/components/ResourceCard';
import ReputationBadge from '@/components/ReputationBadge';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import RatingModal from '@/components/RatingModal';
import PreviewModal from '@/components/PreviewModal';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Calendar,
  Upload,
  Download,
  Star,
  FolderOpen,
  TrendingUp,
  Award,
  Activity,
  CheckCircle,
  Shield,
  Zap,
  BarChart3,
  Clock,
  FileText,
} from 'lucide-react';

export default function ProfilePage() {
  const { user: currentUser } = useAuth();
  const [userDetails, setUserDetails] = useState<User | null>(null);
  const [reputation, setReputation] = useState<ReputationInfo | null>(null);
  const [myResources, setMyResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingTarget, setRatingTarget] = useState<Resource | null>(null);
  const [previewTarget, setPreviewTarget] = useState<Resource | null>(null);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    async function load() {
      try {
        const [user, rep, resources] = await Promise.all([
          api.getUser(currentUser!.id),
          api.getUserReputation(currentUser!.id),
          api.getUserResources(currentUser!.id),
        ]);
        setUserDetails(user);
        setReputation(rep);
        setMyResources(resources);
      } catch (e) {
        console.error('Profile load error:', e);
      }
      setLoading(false);
    }
    load();
  }, [currentUser]);

  const handleDownload = async (r: Resource) => {
    if (!currentUser) return;
    try {
      await api.downloadResource(r.id, currentUser.id);
      setDownloadToast(r.title || r.filename);
      setTimeout(() => setDownloadToast(null), 3000);
      if (r.uploaded_by !== currentUser.id) {
        setRatingTarget(r);
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
      <div className="space-y-6 stagger-children">
        <LoadingSkeleton type="stat" count={4} />
        <LoadingSkeleton type="card" count={3} />
      </div>
    );
  }

  const user = userDetails || currentUser;
  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'N/A';
  const lastActive = user?.last_active_at
    ? new Date(user.last_active_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'N/A';

  const repScore = reputation?.score ?? user?.reputation ?? 0;
  const maxScore = 100;
  const scorePct = Math.min((repScore / maxScore) * 100, 100);

  const stats = [
    { icon: Upload, label: 'Uploads', value: user?.total_uploads ?? 0, color: '#1e8e3e', bg: 'rgba(30,142,62,0.08)' },
    { icon: Download, label: 'Downloads', value: user?.total_downloads ?? 0, color: '#1a73e8', bg: 'rgba(26,115,232,0.08)' },
    { icon: Star, label: 'Avg Rating', value: (user?.average_rating ?? 0).toFixed(1), color: '#f9ab00', bg: 'rgba(249,171,0,0.08)' },
    { icon: TrendingUp, label: 'Reputation', value: repScore.toFixed(1), color: '#a142f4', bg: 'rgba(161,66,244,0.08)' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* ── Top: Profile Card + Quick Stats ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Gradient Banner with embedded info */}
          <div className="relative" style={{ background: 'linear-gradient(135deg, #1a73e8 0%, #4285f4 40%, #34a853 70%, #a142f4 100%)' }}>
            {/* Decorative pattern overlay */}
            <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px), radial-gradient(circle at 50% 50%, white 1px, transparent 1px)', backgroundSize: '60px 60px, 80px 80px, 40px 40px' }} />

            <div className="relative px-8 pt-8 pb-20">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-5">
                  {/* Avatar */}
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black shrink-0 shadow-lg"
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(12px)',
                      color: '#fff',
                      border: '2px solid rgba(255,255,255,0.3)',
                    }}
                  >
                    {user?.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">{user?.username}</h1>
                    <div className="flex items-center gap-3 mt-1.5 text-white/70 text-sm">
                      <span className="flex items-center gap-1"><Mail size={13} /> {user?.email}</span>
                      <span className="w-1 h-1 rounded-full bg-white/30" />
                      <span className="flex items-center gap-1"><Calendar size={13} /> Joined {joinDate}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/15 text-white border border-white/20 backdrop-blur-sm">
                        <Shield size={11} /> {user?.role === 'admin' ? 'Admin' : 'Member'}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/15 text-white border border-white/20 backdrop-blur-sm">
                        <Zap size={11} /> {user?.status === 'online' ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="text-right">
                    <div className="text-white/50 text-xs font-medium uppercase tracking-wider mb-1">Classification</div>
                    <ReputationBadge classification={user?.classification || 'Neutral'} score={repScore} size="lg" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats row overlapping the banner */}
          <div className="px-6 -mt-10 pb-6 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                  className="bg-white rounded-xl p-4 shadow-md border flex items-center gap-3"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: s.bg }}>
                    <s.icon size={20} strokeWidth={1.8} style={{ color: s.color }} />
                  </div>
                  <div>
                    <p className="text-xl font-extrabold leading-none" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
                    <p className="text-[.68rem] font-medium mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{s.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        {/* LEFT: Resources (2 cols) */}
        <motion.div
          className="lg:col-span-2 space-y-4"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen size={15} style={{ color: 'var(--accent)' }} />
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>My Uploads</h2>
              <span className="text-[.65rem] font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>{myResources.length}</span>
            </div>
            <a href="/upload" className="text-xs font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-[var(--accent-dim)] transition-colors" style={{ color: 'var(--accent)' }}>
              <Upload size={13} /> Upload New
            </a>
          </div>

          {myResources.length > 0 ? (
            <div className="space-y-3">
              {myResources.map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }}>
                  <ResourceCard resource={r} onDownload={() => handleDownload(r)} onPreview={() => setPreviewTarget(r)} />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card text-center py-16 border-dashed"
              style={{ borderStyle: 'dashed' }}
            >
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
                <FileText size={28} style={{ color: 'var(--accent)' }} />
              </div>
              <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>No uploads yet</h3>
              <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>Share your first academic resource with the community.</p>
              <a href="/upload" className="btn btn-primary inline-flex items-center gap-2 text-sm">
                <Upload size={15} /> Upload Resource
              </a>
            </motion.div>
          )}
        </motion.div>

        {/* RIGHT: Sidebar (1 col) */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {/* Reputation Score Ring */}
          <div className="card text-center">
            <div className="flex items-center gap-2 mb-4 justify-center">
              <Award size={15} style={{ color: 'var(--accent)' }} />
              <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Reputation Score</h3>
            </div>
            <div className="relative w-28 h-28 mx-auto mb-4">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" stroke="var(--border-subtle)" strokeWidth="8" fill="none" />
                <motion.circle
                  cx="60" cy="60" r="52"
                  stroke="var(--accent)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - scorePct / 100) }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{repScore.toFixed(0)}</span>
                <span className="text-[.6rem] font-semibold" style={{ color: 'var(--text-tertiary)' }}>of {maxScore}</span>
              </div>
            </div>
            <ReputationBadge classification={user?.classification || 'Neutral'} score={repScore} size="md" />

            {/* Mini breakdown */}
            {reputation && (
              <div className="mt-4 pt-4 space-y-2.5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <MiniBar label="Uploads" value={reputation.uploads} max={Math.max(reputation.uploads, 20)} color="#1e8e3e" />
                <MiniBar label="Downloads" value={reputation.downloads} max={Math.max(reputation.downloads, 20)} color="#1a73e8" />
                <MiniBar label="Avg Rating" value={reputation.average_rating} max={5} color="#f9ab00" />
                <div className="flex items-center justify-between pt-2 mt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <span className="text-[.68rem] font-semibold" style={{ color: 'var(--text-secondary)' }}>Speed Throttle</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>{((reputation?.throttle ?? 1) * 100).toFixed(0)}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Account Details */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={14} style={{ color: 'var(--info)' }} />
              <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Account Details</h3>
            </div>
            <div className="space-y-0">
              <InfoRow icon={<Shield size={12} />} label="Username" value={user?.username || 'N/A'} />
              <InfoRow icon={<Mail size={12} />} label="Email" value={user?.email || 'N/A'} />
              <InfoRow icon={<Award size={12} />} label="Role" value={user?.role || 'user'} />
              <InfoRow icon={<BarChart3 size={12} />} label="Peer ID" value={user?.peer_id ? user.peer_id.slice(0, 12) + '...' : 'N/A'} />
              <InfoRow icon={<Zap size={12} />} label="Status" value={user?.status || 'offline'} />
              <InfoRow icon={<Clock size={12} />} label="Last Active" value={lastActive} last />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <a href="/upload" className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all hover:bg-[var(--accent-dim)] hover:scale-[1.02]" style={{ border: '1px solid var(--border-subtle)' }}>
                <Upload size={18} style={{ color: 'var(--accent)' }} />
                <span className="text-[.65rem] font-semibold" style={{ color: 'var(--text-secondary)' }}>Upload</span>
              </a>
              <a href="/library" className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all hover:bg-[var(--accent-dim)] hover:scale-[1.02]" style={{ border: '1px solid var(--border-subtle)' }}>
                <FolderOpen size={18} style={{ color: '#1e8e3e' }} />
                <span className="text-[.65rem] font-semibold" style={{ color: 'var(--text-secondary)' }}>Library</span>
              </a>
              <a href="/search" className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all hover:bg-[var(--accent-dim)] hover:scale-[1.02]" style={{ border: '1px solid var(--border-subtle)' }}>
                <BarChart3 size={18} style={{ color: '#f9ab00' }} />
                <span className="text-[.65rem] font-semibold" style={{ color: 'var(--text-secondary)' }}>Search</span>
              </a>
              <a href="/leaderboard" className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all hover:bg-[var(--accent-dim)] hover:scale-[1.02]" style={{ border: '1px solid var(--border-subtle)' }}>
                <TrendingUp size={18} style={{ color: '#a142f4' }} />
                <span className="text-[.65rem] font-semibold" style={{ color: 'var(--text-secondary)' }}>Rankings</span>
              </a>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      <PreviewModal isOpen={!!previewTarget} resource={previewTarget} onClose={() => setPreviewTarget(null)} onDownload={() => { if (previewTarget) handleDownload(previewTarget); }} />
      <RatingModal isOpen={!!ratingTarget} resourceTitle={ratingTarget?.title ?? ''} onClose={() => setRatingTarget(null)} onRate={handleRate} />

      {/* Download toast */}
      <AnimatePresence>
        {downloadToast && (
          <motion.div
            initial={{ opacity: 0, y: 40, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-6 left-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-xl shadow-lg"
            style={{ background: 'var(--bg-card-solid)', border: '1px solid var(--accent)', backdropFilter: 'blur(12px)' }}
          >
            <CheckCircle size={16} style={{ color: 'var(--accent)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>Downloaded: {downloadToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---- Helpers ---- */

function MiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[.68rem] font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span className="text-[.68rem] font-bold" style={{ color }}>{typeof value === 'number' ? value.toFixed(1) : value}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
        />
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, last = false }: { icon: React.ReactNode; label: string; value: string; last?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: last ? 'none' : '1px solid var(--border-subtle)' }}>
      <span className="flex items-center gap-2 text-[.7rem] font-medium" style={{ color: 'var(--text-tertiary)' }}>
        {icon} {label}
      </span>
      <span className="text-[.7rem] font-semibold max-w-[140px] truncate" style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}