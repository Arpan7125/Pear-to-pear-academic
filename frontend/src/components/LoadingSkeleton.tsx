'use client';

interface Props {
  type?: 'card' | 'stat' | 'table-row' | 'text';
  count?: number;
}

function Pulse({ className }: { className: string }) {
  return <div className={`skeleton-pulse ${className}`} />;
}

export default function LoadingSkeleton({ type = 'card', count = 1 }: Props) {
  const items = Array.from({ length: count });

  if (type === 'stat') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {items.map((_, i) => (
          <div key={i} className="stat-card">
            <Pulse className="h-3 w-20 rounded mb-3" />
            <Pulse className="h-7 w-14 rounded mb-2" />
            <Pulse className="h-2.5 w-24 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((_, i) => (
        <div key={i} className="file-card">
          <Pulse className="w-12 h-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Pulse className="h-3.5 w-3/4 rounded" />
            <Pulse className="h-2.5 w-1/2 rounded" />
          </div>
          <Pulse className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
