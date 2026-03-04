'use client';

import { UserClassification } from '@/lib/types';

interface Props {
  classification: UserClassification;
  score: number;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const cfgMap: Record<UserClassification, { cls: string; icon: string }> = {
  Contributor: { cls: 'badge-contributor', icon: '⬆' },
  Neutral:     { cls: 'badge-neutral',     icon: '◆' },
  Leecher:     { cls: 'badge-leecher',     icon: '▼' },
};

const sizeMap = {
  sm: 'px-2 py-0.5 text-[.68rem]',
  md: 'px-3 py-1 text-xs',
  lg: 'px-4 py-1.5 text-sm',
};

export default function ReputationBadge({ classification, score, showScore = true, size = 'md' }: Props) {
  const { cls, icon } = cfgMap[classification] ?? cfgMap.Neutral;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${cls} ${sizeMap[size]}`}>
      <span className="opacity-80">{icon}</span>
      {classification}
      {showScore && <span className="opacity-60">({score})</span>}
    </span>
  );
}
