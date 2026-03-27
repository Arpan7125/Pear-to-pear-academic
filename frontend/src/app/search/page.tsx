'use client';

import { useEffect, useState, useCallback } from 'react';
import { SearchResults, Resource } from '@/lib/types';
import * as api from '@/lib/api';
import ResourceCard from '@/components/ResourceCard';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Sparkles, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import RatingModal from '@/components/RatingModal';
import PreviewModal from '@/components/PreviewModal';

export default function SearchPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [subjectFilter, setSubjectFilter] = useState('');
  const [sortBy, setSortBy] = useState('');

  const [ratingTarget, setRatingTarget] = useState<Resource | null>(null);
  const [previewTarget, setPreviewTarget] = useState<Resource | null>(null);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); return; }
    try {
      const s = await api.getSearchSuggestions(q);
      setSuggestions(s);
      setShowSuggestions(true);
    } catch { setSuggestions([]); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchSuggestions(query), 250);
    return () => clearTimeout(timer);
  }, [query, fetchSuggestions]);

  const doSearch = async (q: string, subject: string, sort: string) => {
    setLoading(true);
    setShowSuggestions(false);
    try {
      const filters: Record<string, string> = {};
      if (subject) filters.subject = subject;
      if (sort) {
        filters.sort_by = sort;
        filters.sort_order = 'desc';
      }
      const r = await api.searchResources(q, filters);
      setResults(r);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    if (query.trim()) {
      doSearch(query, subjectFilter, sortBy);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectFilter, sortBy]);

  const handleDownload = async (r: Resource) => {
    if (!user) return;
    try {
      await api.downloadResource(r.id, user.id);
      if (results && results.results) {
        setResults({
          ...results,
          results: results.results.map(sr => sr.resource.id === r.id ? { ...sr, resource: { ...sr.resource, download_count: sr.resource.download_count + 1 } } : sr)
        });
      }
      setDownloadToast(r.title || r.filename);
      setTimeout(() => setDownloadToast(null), 3500);

      // The actual download is now handled by api.downloadResource opening the correct URL in a new tab

      if (r.uploaded_by !== user.id) {
        setTimeout(() => setRatingTarget(r), 1000);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to register download');
    }
  };

  const subjects = ['Computer Science','Mathematics','Physics','Chemistry','Biology','Electronics','Mechanical','Civil','Literature','History','Economics','Other'];

  return (
    <div className="space-y-8 h-full flex flex-col">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-2 mb-1">
          <Search size={18} style={{ color: 'var(--accent)' }} />
          <h1 className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Search</h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Find academic resources across the P2P network</p>
      </motion.div>

      {/* Search bar */}
      <motion.div className="relative max-w-3xl" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch(query, subjectFilter, sortBy)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Search resources, subjects, tags�"
              className="search-input w-full"
            />
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute top-full left-0 right-0 mt-2 rounded-xl border overflow-hidden z-30"
                  style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card-solid)', boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}
                >
                  {suggestions.map((s, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      onMouseDown={() => { setQuery(s); doSearch(s, subjectFilter, sortBy); }}
                      className="w-full px-4 py-2.5 text-sm text-left transition-colors flex items-center gap-2 hover:bg-[var(--accent-dim)]"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <Search size={13} className="opacity-40 shrink-0" />
                      {s}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <motion.button onClick={() => doSearch(query, subjectFilter, sortBy)} className="btn btn-primary shrink-0 px-6" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>Search</motion.button>
        </div>
      </motion.div>

      <div className="flex-1 flex flex-col md:flex-row gap-8 pb-10">
        {/* Filters Sidebar */}
        <motion.div className="w-full md:w-64 shrink-0 space-y-6" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={16} style={{ color: 'var(--violet)' }} />
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Filters</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Subject</label>
                <select className="modal-input text-sm" value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}>
                  <option value="">All Subjects</option>
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Sort By</label>
                <select className="modal-input text-sm" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="">Relevance</option>
                  <option value="rating">Highest Rated</option>
                  <option value="downloads">Most Downloaded</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {loading && <div className="space-y-4"><LoadingSkeleton type="card" count={4} /></div>}

          {!loading && results && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span className="font-semibold" style={{ color: 'var(--accent)' }}>{results.total_count}</span> results for &ldquo;<span style={{ color: 'var(--text-primary)' }}>{results.query || 'all'}</span>&rdquo;
                </p>
              </div>
              <div className="space-y-3">
                {results.results?.map((sr, i) => (
                  <motion.div key={sr.resource.id} className="relative group" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <ResourceCard 
                      resource={sr.resource} 
                      onDownload={() => handleDownload(sr.resource)}
                      onPreview={() => setPreviewTarget(sr.resource)}
                    />
                    <div className="absolute top-4 right-4 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity pointer-events-none">
                      <span className="text-xs font-mono px-2 py-1 rounded-md" style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid rgba(6,214,160,0.2)' }}>
                        match {(sr.relevance * 100).toFixed(0)}%
                      </span>
                    </div>
                  </motion.div>
                ))}
                {(!results.results || results.results.length === 0) && (
                  <div className="text-center py-16 card border-dashed">
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No results match your criteria.</p>
                    <button onClick={() => { setSubjectFilter(''); setSortBy(''); }} className="mt-4 text-sm hover:underline" style={{ color: 'var(--accent)' }}>
                      Clear filters
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Empty state */}
          {!loading && !results && (
            <motion.div className="text-center py-24 card border-dashed" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
              <Sparkles size={48} className="mx-auto mb-4 opacity-20" style={{ color: 'var(--text-tertiary)' }} />
              <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Begin Your Search</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Type a query or apply a filter to explore the library.</p>
            </motion.div>
          )}
        </div>
      </div>
      
      {ratingTarget && (
        <RatingModal
          isOpen={!!ratingTarget}
          resourceTitle={ratingTarget.title || ratingTarget.filename}
          onClose={() => setRatingTarget(null)}
          onRate={async (rating, comment) => {
            if (!user) return;
            try {
              await api.rateResource(ratingTarget.id, rating, comment, user.id);
              doSearch(query, subjectFilter, sortBy);
              setRatingTarget(null);
            } catch (e) {
              console.error(e);
              alert('Error saving rating');
            }
          }}
        />
      )}

      {previewTarget && (
        <PreviewModal
          isOpen={true}
          resource={previewTarget}
          onClose={() => setPreviewTarget(null)}
          onDownload={() => handleDownload(previewTarget)}
        />
      )}

      <AnimatePresence>
        {downloadToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--accent)', color: 'var(--text-primary)' }}
          >
            <div className="bg-[var(--accent)] text-white p-1 rounded-full">
              <Check size={14} />
            </div>
            <div>
              <p className="text-sm font-medium">Download Started</p>
              <p className="text-xs text-slate-500 opacity-80 max-w-[200px] truncate">{downloadToast}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}




