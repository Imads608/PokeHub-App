'use client';

import { Card, CardContent } from '@pokehub/frontend/shared-ui-components';
import { Plus } from 'lucide-react';

interface EmptySlotProps {
  index: number;
  onClick: () => void;
  onMouseEnter?: () => void;
  onFocus?: () => void;
}

export function EmptySlot({
  index,
  onClick,
  onMouseEnter,
  onFocus
}: EmptySlotProps) {
  return (
    <Card
      className="flex h-[200px] cursor-pointer flex-col items-center justify-center border-dashed transition-colors hover:bg-muted/50"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onFocus={onFocus}
      tabIndex={0}
    >
      <CardContent className="flex flex-col items-center justify-center p-6">
        <div className="mb-2 rounded-full bg-muted p-2">
          <Plus className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-center font-medium">Add Pokémon</p>
        <p className="text-center text-sm text-muted-foreground">
          Slot {index + 1}
        </p>
      </CardContent>
    </Card>
  );
}
