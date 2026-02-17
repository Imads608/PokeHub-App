'use client';

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@pokehub/frontend/shared-ui-components';
import { Flag } from 'lucide-react';
import { useState } from 'react';
import { TurnTimer } from './turn-timer';

interface BattleHeaderProps {
  format: string;
  turn: number;
  timer: { totalSeconds: number; startedAt: number } | null;
  onForfeit: () => void;
}

export function BattleHeader({
  format,
  turn,
  timer,
  onForfeit,
}: BattleHeaderProps) {
  const [showForfeitDialog, setShowForfeitDialog] = useState(false);

  return (
    <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm px-4 py-2.5">
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="font-semibold text-xs tracking-wide uppercase">
          {format || 'Battle'}
        </Badge>
        <div className="h-4 w-px bg-border/60" />
        <span className="text-sm font-medium text-muted-foreground">
          Turn <span className="text-foreground font-bold tabular-nums">{turn}</span>
        </span>
      </div>

      <div className="flex items-center gap-3">
        {timer && (
          <TurnTimer
            totalSeconds={timer.totalSeconds}
            startedAt={timer.startedAt}
          />
        )}
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => setShowForfeitDialog(true)}
        >
          <Flag className="mr-1.5 h-3.5 w-3.5" />
          Forfeit
        </Button>
      </div>

      <Dialog open={showForfeitDialog} onOpenChange={setShowForfeitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Forfeit Battle?</DialogTitle>
            <DialogDescription>
              Are you sure you want to forfeit? This will count as a loss.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowForfeitDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowForfeitDialog(false);
                onForfeit();
              }}
            >
              Forfeit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
