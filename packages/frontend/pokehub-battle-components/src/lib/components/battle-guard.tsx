'use client';

import { useBattleSocketContextOptional } from '../context/battle-socket.context';
import { Loader2, WifiOff } from 'lucide-react';
import { Button } from '@pokehub/frontend/shared-ui-components';

/**
 * Renders children only when BattleSocketProvider is available and connected.
 * Shows a loading spinner during the Suspense fallback (before the
 * lazy-loaded BattleShell mounts the provider), and a connection lost
 * overlay when the socket is permanently disconnected.
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

  if (context.socketStatus === 'connecting') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Connecting to battle server...</p>
      </div>
    );
  }

  if (context.socketStatus === 'disconnected') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <WifiOff className="h-10 w-10 text-muted-foreground" />
        <p className="text-lg font-semibold">Connection lost</p>
        <p className="text-sm text-muted-foreground">
          Please refresh the page to reconnect.
        </p>
        <Button onClick={() => window.location.reload()}>
          Refresh
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
