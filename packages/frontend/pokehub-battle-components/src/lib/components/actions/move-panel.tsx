'use client';

import type { Battle } from '@pkmn/client';
import type { TypeName } from '@pkmn/dex';
import { MoveButton } from './move-button';

interface MovePanelProps {
  battle: Battle;
  onMoveSelect: (choice: string) => void;
  disabled?: boolean;
}

export function MovePanel({ battle, onMoveSelect, disabled }: MovePanelProps) {
  const request = battle.request;
  if (!request || request.requestType !== 'move') return null;

  const active = request.active?.[0];
  if (!active) return null;

  const moves = active.moves;

  return (
    <div className="grid grid-cols-2 gap-2">
      {moves.map((move, index) => {
        // Look up move type from the Dex via battle.gen
        const dexMove = battle.gen.moves.get(move.id);

        return (
          <MoveButton
            key={move.id}
            name={move.name}
            type={dexMove?.type as TypeName | undefined}
            pp={'pp' in move ? move.pp : undefined}
            maxpp={'maxpp' in move ? move.maxpp : undefined}
            disabled={disabled || ('disabled' in move && move.disabled)}
            onSelect={() => onMoveSelect(`move ${index + 1}`)}
          />
        );
      })}
    </div>
  );
}
