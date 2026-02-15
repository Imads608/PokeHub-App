'use client';

interface TurnTimerProps {
  secondsRemaining: number;
  warning: boolean;
}

export function TurnTimer({ secondsRemaining, warning }: TurnTimerProps) {
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

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
