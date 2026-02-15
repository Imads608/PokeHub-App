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
  timer: { secondsRemaining: number; warning: boolean } | null;
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
    <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-2">
      <div className="flex items-center gap-3">
        <Badge variant="outline">{format || 'Battle'}</Badge>
        <span className="text-sm text-muted-foreground">Turn {turn}</span>
      </div>

      <div className="flex items-center gap-3">
        {timer && (
          <TurnTimer
            secondsRemaining={timer.secondsRemaining}
            warning={timer.warning}
          />
        )}
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => setShowForfeitDialog(true)}
        >
          <Flag className="mr-1.5 h-4 w-4" />
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
