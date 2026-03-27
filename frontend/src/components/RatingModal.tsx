'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Star } from 'lucide-react';

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
        initial={{ opacity: 0, y: 40, scale: 0.93 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Download success header */}
        <div className="text-center mb-6">
          <motion.div
            className="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(6,214,160,0.12)', border: '1px solid rgba(6,214,160,0.25)' }}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 18 }}
          >
            <CheckCircle2 size={28} style={{ color: 'var(--accent)' }} strokeWidth={1.8} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--accent)' }}>
              Download Complete
            </p>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Leave a Review</h2>
            <p className="text-xs mt-1 px-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              You just downloaded&nbsp;
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {resourceTitle || 'this resource'}
              </span>
              . How was it?
            </p>
          </motion.div>
        </div>

        {/* Star rating */}
        <div className="flex justify-center gap-3 mb-2">
          {[1, 2, 3, 4, 5].map(s => (
            <motion.button
              key={s}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(s)}
              className="transition-colors"
              style={{
                color: s <= (hover || rating) ? 'var(--warning)' : 'var(--text-tertiary)',
                filter: s <= (hover || rating) ? 'drop-shadow(0 0 6px rgba(251,191,36,0.45))' : 'none',
              }}
              whileHover={{ scale: 1.3, y: -4 }}
              whileTap={{ scale: 0.85 }}
            >
              <Star size={28} fill={s <= (hover || rating) ? 'currentColor' : 'none'} strokeWidth={1.5} />
            </motion.button>
          ))}
        </div>
        <AnimatePresence>
          {(hover || rating) > 0 && (
            <motion.p
              className="text-center text-xs font-semibold mb-4"
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
          placeholder="Share your thoughts (optional)…"
          rows={3}
          className="modal-input mb-5"
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="btn btn-secondary flex-1">Skip</button>
          <button
            onClick={handleSubmit}
            className="btn btn-primary flex-1"
            disabled={!rating || submitting}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-[var(--text-inverse)] border-t-transparent rounded-full animate-spin" />
                Saving…
              </span>
            ) : `Submit ${rating ? rating + '/5 ★' : 'Rating'}`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
