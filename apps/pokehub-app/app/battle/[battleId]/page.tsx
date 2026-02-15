'use client';

import {
  useBattleSocketContext,
  BattleContainer,
} from '@pokehub/frontend/pokehub-battle-components';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function BattlePage() {
  const { battleId } = useParams<{ battleId: string }>();
  const { state, rejoin } = useBattleSocketContext();
  const router = useRouter();

  // If we're not in battle phase for this battleId, attempt rejoin
  useEffect(() => {
    if (state.phase === 'idle' && battleId) {
      rejoin(battleId);
    }
  }, [state.phase, battleId, rejoin]);

  // Redirect to lobby if battle ended
  useEffect(() => {
    if (state.phase === 'ended') return; // Show end overlay, don't redirect
    if (state.phase === 'idle' && !state.battleId) {
      // No active battle and not loading — go back to lobby
      const timer = setTimeout(() => router.push('/battle'), 3000);
      return () => clearTimeout(timer);
    }
  }, [state.phase, state.battleId, router]);

  if (state.phase !== 'battle' && state.phase !== 'ended') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading battle...</p>
      </div>
    );
  }

  return <BattleContainer />;
}
