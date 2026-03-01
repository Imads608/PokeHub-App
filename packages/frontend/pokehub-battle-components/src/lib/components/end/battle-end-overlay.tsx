'use client';

import type { BattleEndReason } from '@pokehub/shared/pokemon-battle-types';
import { Button } from '@pokehub/frontend/shared-ui-components';
import { Trophy, ThumbsDown, Save, Swords, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BattleEndOverlayProps {
  /** Winner's user ID, or null for draw */
  winner: string | null;
  /** Current user's ID */
  myUserId: string;
  endReason: BattleEndReason | null;
  canSaveReplay: boolean;
  replaySaved: boolean;
  onSaveReplay: () => void;
}

export function BattleEndOverlay({
  winner,
  myUserId,
  endReason,
  canSaveReplay,
  replaySaved,
  onSaveReplay,
}: BattleEndOverlayProps) {
  const router = useRouter();
  const isWinner = winner !== null && winner === myUserId;
  const isTie = winner === null && endReason === 'draw';

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-5 rounded-2xl border border-border/50 bg-card/90 backdrop-blur-sm p-10 shadow-2xl max-w-sm w-full mx-4">
        {isTie ? (
          <>
            <div className="rounded-full bg-muted/50 p-4">
              <Swords className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-3xl font-black tracking-tight">Draw!</h2>
          </>
        ) : isWinner ? (
          <>
            <div className="rounded-full bg-yellow-500/10 p-4 ring-1 ring-yellow-500/20">
              <Trophy className="h-10 w-10 text-yellow-500" />
            </div>
            <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
              Victory!
            </h2>
          </>
        ) : (
          <>
            <div className="rounded-full bg-muted/50 p-4">
              <ThumbsDown className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-muted-foreground">
              Defeat
            </h2>
          </>
        )}

        {endReason && endReason !== 'draw' && endReason !== 'win' && (
          <p className="text-sm text-muted-foreground capitalize -mt-2">
            {endReason.replace(/_/g, ' ')}
          </p>
        )}

        <div className="flex flex-col gap-2 w-full mt-2">
          {canSaveReplay && (
            <Button
              variant="outline"
              className="w-full"
              onClick={onSaveReplay}
              disabled={replaySaved}
            >
              <Save className="mr-2 h-4 w-4" />
              {replaySaved ? 'Replay Saved' : 'Save Replay'}
            </Button>
          )}
          <Button className="w-full" onClick={() => router.push('/battle')}>
            <Swords className="mr-2 h-4 w-4" />
            Find New Battle
          </Button>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => router.push('/')}
          >
            <Home className="mr-2 h-4 w-4" />
            Exit
          </Button>
        </div>
      </div>
    </div>
  );
}
