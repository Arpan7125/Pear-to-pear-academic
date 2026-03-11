'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Download, User, Star, Clock, Sparkles } from 'lucide-react';
import { Resource } from '@/lib/types';

interface PreviewModalProps {
  isOpen: boolean;
  resource: Resource | null;
  onClose: () => void;
  onDownload: () => void;
}

export default function PreviewModal({ isOpen, resource, onClose, onDownload }: PreviewModalProps) {
  if (!resource) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="card relative w-full max-w-xl shadow-2xl bg-[var(--bg-card-solid)]"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-2 rounded-full hover:bg-[var(--bg-input)] transition-colors"
            >
              <X size={20} className="text-[var(--text-secondary)]" />
            </button>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                  <FileText size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)] leading-tight">{resource.title || resource.filename}</h2>
                  <p className="text-sm font-medium text-[var(--text-tertiary)]">{resource.subject} • {resource.type}</p>
                </div>
              </div>
              
              <div className="bg-[var(--bg-input)] rounded-lg p-6 mb-6 min-h-[250px] flex flex-col shadow-inner border" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-3 border-b border-[var(--border-subtle)] pb-2">
                    <Sparkles size={14} style={{ color: 'var(--accent)' }} />
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>AI Document Preview</span>
                  </div>
                  {resource.preview ? (
                    <div className="text-sm leading-relaxed text-[var(--text-primary)]" style={{ whiteSpace: 'pre-line' }}>
                      {resource.preview}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-50 space-y-4 py-8">
                      <FileText size={48} style={{ color: 'var(--text-tertiary)' }} />
                      <p className="text-sm text-[var(--text-secondary)]">No AI preview available for this document.</p>
                      <p className="text-xs text-[var(--text-tertiary)] max-w-[200px] text-center">Use the Auto-Generate feature during upload to create previews using Google Gemini.</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Description</p>
                  <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                    {resource.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[var(--bg-input)] p-3 rounded-lg flex items-center gap-3">
                  <User size={16} className="text-[var(--accent)]" />
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">Uploader</p>
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate max-w-[120px]">{resource.uploaded_by}</p>
                  </div>
                </div>
                <div className="bg-[var(--bg-input)] p-3 rounded-lg flex items-center gap-3">
                  <Star size={16} className="text-[var(--accent)]" />
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">Rating</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{resource.average_rating ? resource.average_rating.toFixed(1) : 'New'}</p>
                  </div>
                </div>
                <div className="bg-[var(--bg-input)] p-3 rounded-lg flex items-center gap-3">
                  <Clock size={16} className="text-[var(--accent)]" />
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">Uploaded</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {new Date(resource.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="bg-[var(--bg-input)] p-3 rounded-lg flex items-center gap-3">
                  <Download size={16} className="text-[var(--accent)]" />
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">Downloads</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{resource.download_count}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                className="btn btn-primary flex-1 flex items-center justify-center gap-2 py-3"
                onClick={() => {
                  onDownload();
                  onClose();
                }}
              >
                <Download size={18} />
                Download Resource
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}


