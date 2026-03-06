'use client';

import { useBattleSocketContextOptional } from '../context/battle-socket.context';
import { Loader2 } from 'lucide-react';

/**
 * Renders children only when BattleSocketProvider is available.
 * Shows a loading spinner during the Suspense fallback (before the
 * lazy-loaded BattleShell mounts the provider).
 */
export function BattleGuard({ children }: { children: React.ReactNode }) {
  const context = useBattleSocketContextOptional();

  if (!context) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading battle...</p>
      </div>
    );
  }

  return <>{children}</>;
}
