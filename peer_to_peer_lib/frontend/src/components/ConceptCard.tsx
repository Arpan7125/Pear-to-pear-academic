'use client';

import { GoConcept } from '@/lib/types';

interface Props {
  concept: GoConcept;
  isActive?: boolean;
  onClick?: () => void;
}

export default function ConceptCard({ concept, isActive = false, onClick }: Props) {
  return (
    <div
      className={`concept-card ${isActive ? 'active' : ''}`}
      onClick={onClick}
      id={`concept-${concept.id}`}
    >
      <div className="flex items-start gap-4">
        <div className="concept-number">{concept.id}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1">
            <h3 className="font-semibold text-[var(--text-primary)] text-[.95rem]">{concept.title}</h3>
          </div>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{concept.description}</p>

          {isActive && (
            <div className="mt-5 animate-in">
              {/* Code */}
              <div className="code-block mb-4">
                <pre><code>{concept.codeExample}</code></pre>
              </div>

              {/* Insight */}
              <div className="rounded-lg p-4 mb-4" style={{ background: 'var(--accent-dim)', border: '1px solid rgba(6,214,160,.18)' }}>
                <p className="text-sm text-[var(--accent)]">
                  <span className="font-semibold">Key Insight:</span>{' '}
                  <span className="text-[var(--text-secondary)]">{concept.explanation}</span>
                </p>
              </div>

              {/* File locations */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[.7rem] text-[var(--text-tertiary)]">Source files:</span>
                {concept.fileLocations.map((f, i) => (
                  <span key={i} className="text-[.72rem] font-mono bg-[rgba(255,255,255,.04)] text-[var(--text-secondary)] px-2.5 py-1 rounded-md border border-[var(--border-subtle)]">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
