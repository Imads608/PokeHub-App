'use client';

import type { Battle, Pokemon } from '@pkmn/client';
import type { TypeName } from '@pkmn/dex';
import type { BattleMechanic } from '../../types/battle-ui.types';
import { MoveButton } from './move-button';
import { MoveTooltip } from './move-tooltip';

interface MovePanelProps {
  battle: Battle;
  opponentPokemon: Pokemon | null;
  activeMechanic?: BattleMechanic | null;
  onMoveSelect: (choice: string) => void;
  disabled?: boolean;
}

/** Maps mechanic to the suffix appended to the choice string */
const mechanicSuffixes: Record<BattleMechanic, string> = {
  mega: ' mega',
  zmove: ' zmove',
  dynamax: ' dynamax',
  tera: ' terastallize',
};

export function MovePanel({
  battle,
  opponentPokemon,
  activeMechanic,
  onMoveSelect,
  disabled,
}: MovePanelProps) {
  const request = battle.request;
  if (!request || request.requestType !== 'move') return null;

  const active = request.active?.[0];
  if (!active) return null;

  const moves = active.moves;
  const suffix = activeMechanic ? mechanicSuffixes[activeMechanic] : '';

  return (
    <div className="grid grid-cols-2 gap-2">
      {moves.map((move, index) => {
        // Look up move type from the Dex via battle.gen
        const dexMove = battle.gen.moves.get(move.id);

        // When Z-Move is active, swap to Z-move data if available
        const zMoveEntry =
          activeMechanic === 'zmove' && active.zMoves
            ? active.zMoves[index]
            : null;

        const zDexMove = zMoveEntry
          ? battle.gen.moves.get(zMoveEntry.id)
          : null;

        const displayName = zMoveEntry ? zMoveEntry.name : move.name;
        const displayType = (zDexMove?.type ?? dexMove?.type) as
          | TypeName
          | undefined;
        const tooltipMove = zDexMove ?? dexMove;

        return (
          <MoveTooltip
            key={move.id}
            dexMove={tooltipMove}
            battle={battle}
            opponentPokemon={opponentPokemon}
          >
            <MoveButton
              name={displayName}
              type={displayType}
              pp={'pp' in move ? move.pp : undefined}
              maxpp={'maxpp' in move ? move.maxpp : undefined}
              power={tooltipMove?.basePower || null}
              accuracy={tooltipMove?.accuracy ?? null}
              category={tooltipMove?.category}
              disabled={disabled || ('disabled' in move && move.disabled)}
              onSelect={() => onMoveSelect(`move ${index + 1}${suffix}`)}
            />
          </MoveTooltip>
        );
      })}
    </div>
  );
}
