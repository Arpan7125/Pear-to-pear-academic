'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import * as api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle, AlertTriangle, FileText, Sparkles, TrendingUp, Star, Shield } from 'lucide-react';

const subjects = [
  'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Electronics', 'Mechanical', 'Civil', 'Literature', 'History', 'Economics', 'Other',
];

export default function UploadPage() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [subject, setSubject] = useState('Computer Science');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFile) return;
    setError('');
    setUploading(true);
    try {
      await api.createResource({
        filename: selectedFile.name,
        title,
        description,
        subject,
        tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
        size: selectedFile.size,
      }, user.id);
      setSuccess(true);
      setTitle(''); setSelectedFile(null); setDescription(''); setTagsInput('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const guidelines = [
    { icon: Shield, text: 'Only upload materials you have rights to share' },
    { icon: FileText, text: 'Add descriptive titles and tags for discoverability' },
    { icon: TrendingUp, text: 'Each upload increases your reputation (+2 points)' },
    { icon: Sparkles, text: 'Higher reputation = faster download speeds' },
  ];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Upload Resource</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Share academic materials with the P2P network</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload form */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <div className="card" style={{ padding: '2rem' }}>
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="rounded-xl p-4 mb-6"
                  style={{ background: 'var(--success-dim)', border: '1px solid rgba(6,214,160,0.2)' }}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} style={{ color: 'var(--accent)' }} />
                    <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>Resource uploaded successfully!</p>
                  </div>
                  <p className="text-xs mt-1 ml-7" style={{ color: 'var(--text-secondary)' }}>Your file is now shared on the P2P network.</p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* File drop zone */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Select File *</label>
                <motion.div
                  className="rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-300"
                  style={{
                    borderColor: selectedFile ? 'var(--accent)' : dragOver ? 'var(--accent)' : 'var(--border-mid)',
                    background: selectedFile ? 'var(--accent-dim)' : dragOver ? 'var(--accent-dim)' : 'transparent',
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  whileHover={{ borderColor: 'var(--accent)', background: 'rgba(6,214,160,0.04)' }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.pptx,.xlsx,.txt,.md"
                  />
                  {selectedFile ? (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      <FileText size={40} className="mx-auto mb-3" style={{ color: 'var(--accent)' }} />
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{selectedFile.name}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      <p className="text-xs mt-2" style={{ color: 'var(--accent)' }}>Click or drop to replace</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      animate={dragOver ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <Upload size={40} className="mx-auto mb-3" style={{ color: dragOver ? 'var(--accent)' : 'var(--text-tertiary)' }} />
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Drag & drop your file here, or click to browse</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>PDF, DOC, DOCX, PPTX, XLSX up to 100MB</p>
                    </motion.div>
                  )}
                </motion.div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Go Programming Fundamentals"
                  className="modal-input"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Subject *</label>
                  <select value={subject} onChange={e => setSubject(e.target.value)} className="modal-input">
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Tags (comma separated)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={e => setTagsInput(e.target.value)}
                    placeholder="golang, programming, tutorial"
                    className="modal-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Brief description of the resource..."
                  rows={4}
                  className="modal-input"
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl px-4 py-3 text-xs font-medium"
                    style={{ color: 'var(--danger)', background: 'var(--danger-dim)', border: '1px solid rgba(244,63,94,0.2)' }}
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} />
                      {error}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                className="btn btn-primary w-full"
                style={{ padding: '14px 22px' }}
                disabled={uploading || !title || !selectedFile}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-[var(--text-inverse)] border-t-transparent rounded-full animate-spin" />
                    Uploading…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Upload size={16} />
                    Upload Resource
                  </span>
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>

        {/* Sidebar */}
        <div className="space-y-5 stagger-children">
          <div className="card">
            <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Upload Guidelines</h3>
            <div className="space-y-3">
              {guidelines.map((g, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-dim)' }}>
                    <g.icon size={14} style={{ color: 'var(--accent)' }} />
                  </div>
                  <span className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{g.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Your Stats</h3>
            <div className="space-y-3">
              {[
                { label: 'Uploads', value: user?.total_uploads ?? 0, color: 'var(--accent)' },
                { label: 'Downloads', value: user?.total_downloads ?? 0, color: 'var(--info)' },
                { label: 'Reputation', value: user?.reputation ?? 0, color: 'var(--accent)' },
              ].map(s => (
                <div key={s.label} className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
                  <span className="font-mono font-semibold text-sm" style={{ color: s.color }}>{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</span>
                </div>
              ))}
              <div className="divider-glow" />
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Status</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{
                  color: user?.classification === 'Contributor' ? 'var(--accent)' : user?.classification === 'Leecher' ? 'var(--danger)' : 'var(--warning)',
                  background: user?.classification === 'Contributor' ? 'var(--success-dim)' : user?.classification === 'Leecher' ? 'var(--danger-dim)' : 'var(--warning-dim)',
                }}>
                  {user?.classification}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
