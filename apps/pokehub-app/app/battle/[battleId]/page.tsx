'use client';

import {
  useBattleSocketContextOptional,
  BattleContainer,
} from '@pokehub/frontend/pokehub-battle-components';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground">Loading battle...</p>
    </div>
  );
}

export default function BattlePage() {
  const { battleId } = useParams<{ battleId: string }>();
  const context = useBattleSocketContextOptional();
  const router = useRouter();

  const state = context?.state;
  const rejoin = context?.rejoin;

  // If we're not in battle phase for this battleId, attempt rejoin
  useEffect(() => {
    if (state?.phase === 'idle' && battleId && !state.error) {
      rejoin?.(battleId);
    }
  }, [state?.phase, battleId, state?.error, rejoin]);

  // Redirect to lobby if battle ended or rejoin failed
  useEffect(() => {
    if (!state) return;
    if (state.phase === 'ended') return; // Show end overlay, don't redirect
    if (
      state.phase === 'idle' &&
      (!state.battleId || state.error)
    ) {
      // No active battle or rejoin failed — go back to lobby
      const timer = setTimeout(() => router.push('/battle'), 3000);
      return () => clearTimeout(timer);
    }
  }, [state, router]);

  // Provider not mounted yet (Suspense fallback) or not in battle phase
  if (!context || (state?.phase !== 'battle' && state?.phase !== 'ended')) {
    return <LoadingSpinner />;
  }

  return <BattleContainer />;
}
