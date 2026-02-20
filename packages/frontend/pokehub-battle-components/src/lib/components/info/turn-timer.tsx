'use client';

import { useState, useEffect } from 'react';

interface TurnTimerProps {
  totalSeconds: number;
  startedAt: number;
}

export function TurnTimer({ totalSeconds, startedAt }: TurnTimerProps) {
  const [remaining, setRemaining] = useState(() =>
    computeRemaining(totalSeconds, startedAt)
  );

  useEffect(() => {
    // Sync immediately when props change (new turn / server sync)
    setRemaining(computeRemaining(totalSeconds, startedAt));

    const interval = setInterval(() => {
      setRemaining(computeRemaining(totalSeconds, startedAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [totalSeconds, startedAt]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const warning = remaining <= totalSeconds / 2;

  return (
    <span
      className={`tabular-nums font-mono text-sm font-medium ${
        warning ? 'text-red-500 animate-pulse' : 'text-muted-foreground'
      }`}
    >
      {minutes}:{seconds.toString().padStart(2, '0')}
    </span>
  );
}

function computeRemaining(totalSeconds: number, startedAt: number): number {
  const elapsed = Math.floor((Date.now() - startedAt) / 1000);
  return Math.max(0, totalSeconds - elapsed);
}
