'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  resourceTitle: string;
  onClose: () => void;
  onRate: (rating: number, comment: string) => void;
}

export default function RatingModal({ isOpen, resourceTitle, onClose, onRate }: Props) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!rating) return;
    setSubmitting(true);
    try {
      await onRate(rating, comment);
      setRating(0); setComment('');
      onClose();
    } finally { setSubmitting(false); }
  };

  const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal-content max-w-md"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center" style={{ background: 'var(--warning-dim)', border: '1px solid rgba(251,191,36,0.15)' }}>
            <span className="text-xl">⭐</span>
          </div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Rate Resource</h2>
          <p className="text-xs mt-1 truncate px-4" style={{ color: 'var(--text-secondary)' }}>{resourceTitle}</p>
        </div>

        <div className="flex justify-center gap-3 mb-2">
          {[1,2,3,4,5].map(s => (
            <motion.button
              key={s}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(s)}
              className="text-3xl transition-colors"
              style={{
                color: s <= (hover || rating) ? 'var(--warning)' : 'var(--text-tertiary)',
                filter: s <= (hover || rating) ? 'drop-shadow(0 0 6px rgba(251,191,36,0.4))' : 'none',
              }}
              whileHover={{ scale: 1.25, y: -3 }}
              whileTap={{ scale: 0.9 }}
            >
              ★
            </motion.button>
          ))}
        </div>
        <AnimatePresence>
          {(hover || rating) > 0 && (
            <motion.p
              className="text-center text-xs font-medium mb-4"
              style={{ color: 'var(--warning)' }}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {labels[hover || rating]}
            </motion.p>
          )}
        </AnimatePresence>

        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Optional comment…"
          rows={3}
          className="modal-input mb-5"
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="btn btn-secondary flex-1">Skip</button>
          <button onClick={handleSubmit} className="btn btn-primary flex-1" disabled={!rating || submitting}>
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-[var(--text-inverse)] border-t-transparent rounded-full animate-spin" />
                Saving…
              </span>
            ) : `Rate ${rating ? rating + '/5' : '—'}`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
