'use client';

interface HPBarProps {
  current: number;
  max: number;
}

export function HPBar({ current, max }: HPBarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;

  const barColor =
    pct > 50
      ? 'from-emerald-400 to-emerald-500'
      : pct > 25
        ? 'from-yellow-400 to-amber-500'
        : 'from-red-400 to-red-600';

  const glowColor =
    pct > 50
      ? 'shadow-emerald-500/40'
      : pct > 25
        ? 'shadow-yellow-500/40'
        : 'shadow-red-500/40';

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 rounded-full bg-black/30 overflow-hidden ring-1 ring-white/10">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barColor} shadow-sm ${pct > 0 ? glowColor : ''} transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] font-semibold tabular-nums w-9 text-right text-muted-foreground/80">
        {Math.round(pct)}%
      </span>
    </div>
  );
}
