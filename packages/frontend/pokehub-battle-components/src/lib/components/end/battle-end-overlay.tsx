'use client';

import type { BattleEndReason } from '@pokehub/shared/pokemon-battle-types';
import { Button } from '@pokehub/frontend/shared-ui-components';
import { Trophy, ThumbsDown, Save, Swords, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BattleEndOverlayProps {
  winner: string | null;
  myName: string | null;
  endReason: BattleEndReason | null;
  canSaveReplay: boolean;
  replaySaved: boolean;
  onSaveReplay: () => void;
}

export function BattleEndOverlay({
  winner,
  myName,
  endReason,
  canSaveReplay,
  replaySaved,
  onSaveReplay,
}: BattleEndOverlayProps) {
  const router = useRouter();
  const isWinner = winner !== null && myName !== null && winner === myName;
  const isTie = winner === null && endReason === 'draw';

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-xl border bg-card p-8 shadow-lg">
        {isTie ? (
          <>
            <Swords className="h-12 w-12 text-muted-foreground" />
            <h2 className="text-2xl font-bold">Draw!</h2>
          </>
        ) : isWinner ? (
          <>
            <Trophy className="h-12 w-12 text-yellow-500" />
            <h2 className="text-2xl font-bold">Victory!</h2>
          </>
        ) : (
          <>
            <ThumbsDown className="h-12 w-12 text-muted-foreground" />
            <h2 className="text-2xl font-bold">Defeat</h2>
          </>
        )}

        {endReason && endReason !== 'draw' && (
          <p className="text-sm text-muted-foreground capitalize">
            {endReason.replace(/_/g, ' ')}
          </p>
        )}

        <div className="flex gap-2 mt-2">
          {canSaveReplay && (
            <Button
              variant="outline"
              onClick={onSaveReplay}
              disabled={replaySaved}
            >
              <Save className="mr-2 h-4 w-4" />
              {replaySaved ? 'Replay Saved' : 'Save Replay'}
            </Button>
          )}
          <Button onClick={() => router.push('/battle')}>
            <Swords className="mr-2 h-4 w-4" />
            Find New Battle
          </Button>
          <Button variant="ghost" onClick={() => router.push('/')}>
            <Home className="mr-2 h-4 w-4" />
            Exit
          </Button>
        </div>
      </div>
    </div>
  );
}
