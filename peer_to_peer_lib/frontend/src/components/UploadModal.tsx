'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: FormData) => void;
}

const subjects = ['Computer Science','Mathematics','Physics','Chemistry','Biology','Electronics','Mechanical','Civil','Literature','History','Economics','Other'];

export default function UploadModal({ isOpen, onClose, onUpload }: Props) {
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [subject, setSubject] = useState('Computer Science');
  const [description, setDescription] = useState('');
  const [preview, setPreview] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' '));
      }
    }
  };

  const handleGeneratePreview = async () => {
    if (!selectedFile) return;
    setGeneratingPreview(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const res = await fetch('/api/ai-preview', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setPreview(data.preview);
      } else {
        alert(data.error || 'Failed to generate preview');
      }
    } catch (err) {
      console.error(err);
      alert('Error generating AI preview.');
    } finally {
      setGeneratingPreview(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('preview', preview);
      formData.append('subject', subject);
      
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      formData.append('tags', tags.join(','));

      await onUpload(formData);
      
      setTitle(''); setSelectedFile(null); setDescription(''); setPreview(''); setTagsInput('');
      onClose();
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-dim)', border: '1px solid rgba(6,214,160,0.15)' }}>
              <Upload size={18} style={{ color: 'var(--accent)' }} />
            </div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Upload Resource</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ color: 'var(--text-tertiary)', background: 'rgba(255,255,255,0.04)' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Select File *</label>
            <div 
              className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300"
              style={{
                borderColor: selectedFile ? 'var(--accent)' : 'var(--border-mid)',
                background: selectedFile ? 'var(--accent-dim)' : 'transparent',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                required 
              />
              {selectedFile ? (
                <div>
                  <FileText size={24} className="mx-auto mb-2" style={{ color: 'var(--accent)' }} />
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{selectedFile.name}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div>
                  <Upload size={24} className="mx-auto mb-2" style={{ color: 'var(--text-tertiary)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Click to browse files</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>PDF, DOCX, PPTX up to 50MB</p>
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Resource Title" className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Subject *</label>
            <select value={subject} onChange={e => setSubject(e.target.value)} className="input-field">
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description" rows={2} className="input-field" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold" style={{ color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>AI Document Preview</label>
              <button 
                type="button" 
                onClick={handleGeneratePreview}
                disabled={generatingPreview || !selectedFile}
                className="text-xs font-medium px-2 py-1 rounded transition-colors disabled:opacity-50"
                style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
              >
                {generatingPreview ? 'Generating...' : '✨ Auto-Generate'}
              </button>
            </div>
            <textarea value={preview} onChange={e => setPreview(e.target.value)} placeholder="AI will read the file and generate a summary..." rows={3} className="input-field" style={{ fontSize: '0.8rem' }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Tags (comma separated)</label>
            <input type="text" value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="golang, programming" className="input-field" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn btn-primary flex-1" disabled={uploading || !selectedFile || !title}>
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-[var(--text-inverse)] border-t-transparent rounded-full animate-spin" />
                  Uploading…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Upload size={14} />
                  Upload File
                </span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
