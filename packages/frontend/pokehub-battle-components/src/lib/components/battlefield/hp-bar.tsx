'use client';

interface HPBarProps {
  current: number;
  max: number;
}

export function HPBar({ current, max }: HPBarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;

  const color =
    pct > 50 ? 'bg-emerald-500' : pct > 25 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-2">
      <div className="h-2.5 flex-1 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums w-10 text-right">
        {Math.round(pct)}%
      </span>
    </div>
  );
}
