'use client';

import { Resource } from '@/lib/types';
import { motion } from 'framer-motion';
import { Download, Eye } from 'lucide-react';

interface ResourceCardProps {
  resource: Resource;
  onDownload?: () => void;
  onPreview?: () => void;
}

const typeConfig: Record<string, { bg: string; color: string; label: string; glow: string }> = {
  pdf:          { bg: 'rgba(217,48,37,.1)', color: '#d93025', label: 'PDF', glow: 'rgba(217,48,37,.2)' },
  document:     { bg: 'rgba(26,115,232,.1)', color: '#1a73e8', label: 'DOC', glow: 'rgba(26,115,232,.2)' },
  presentation: { bg: 'rgba(249,171,0,.1)', color: '#f9ab00', label: 'PPT', glow: 'rgba(249,171,0,.2)' },
  spreadsheet:  { bg: 'rgba(30,142,62,.1)',  color: '#1e8e3e', label: 'XLS', glow: 'rgba(30,142,62,.2)' },
  other:        { bg: 'rgba(0,0,0,.04)', color: '#5f6368', label: 'FILE', glow: 'rgba(0,0,0,.08)' },
};

function fmtSize(b: number) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

export default function ResourceCard({ resource, onDownload, onPreview }: ResourceCardProps) {
  const cfg = typeConfig[resource.type] || typeConfig.other;

  return (
    <motion.div
      className="file-card group"
      whileHover={{ y: -3, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
    >
      {/* Type badge */}
      <div
        className="file-icon"
        style={{
          background: cfg.bg,
          color: cfg.color,
          border: `1px solid ${cfg.glow}`,
          boxShadow: `0 0 12px ${cfg.glow}`,
        }}
      >
        <span className="text-xs font-bold tracking-wider">{cfg.label}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold truncate text-[.92rem]" style={{ color: 'var(--text-primary)' }}>
          {resource.title || resource.filename}
        </h3>
        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
          {resource.subject}
          <span className="mx-1.5 opacity-30">·</span>
          {fmtSize(resource.size)}
          <span className="mx-1.5 opacity-30">·</span>
          <span className="inline-flex items-center gap-1">
            <Download size={10} strokeWidth={2.2} />
            {resource.download_count}
          </span>
        </p>
        {resource.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {resource.tags.slice(0, 3).map((t, i) => (
              <span key={i} className="tag">{t}</span>
            ))}
            {resource.tags.length > 3 && (
              <span className="text-[.68rem]" style={{ color: 'var(--text-tertiary)' }}>+{resource.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Rating + action */}
      <div className="text-right shrink-0 flex flex-col items-end gap-2.5">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map(s => (
            <span
              key={s}
              className="text-sm transition-all duration-200"
              style={{
                color: s <= Math.round(resource.average_rating) ? 'var(--warning)' : 'var(--text-tertiary)',
                opacity: s <= Math.round(resource.average_rating) ? 1 : 0.2,
                filter: s <= Math.round(resource.average_rating) ? 'drop-shadow(0 0 3px rgba(251, 191, 36, 0.4))' : 'none',
              }}
            >
              ★
            </span>
          ))}
          <span className="text-[.68rem] ml-1" style={{ color: 'var(--text-tertiary)' }}>({resource.total_ratings})</span>
        </div>
        <div className="flex gap-2">
          {onPreview && (
            <motion.button
              onClick={onPreview}
              className="btn btn-secondary text-xs py-1.5 px-3 rounded-xl"
              style={{ fontSize: '.78rem' }}
              title="Preview"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Eye size={13} strokeWidth={2.2} />
              Preview
            </motion.button>
          )}
          {onDownload && (
            <motion.button
              onClick={onDownload}
              className="btn btn-primary text-xs py-1.5 px-4 rounded-xl"
              style={{ fontSize: '.78rem' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download size={13} strokeWidth={2.2} />
              Download
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
