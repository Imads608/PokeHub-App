'use client';

import type { Battle } from '@pkmn/client';
import type { StatusName } from '@pkmn/dex';
import { Icons } from '@pkmn/img';
import { Button, Badge } from '@pokehub/frontend/shared-ui-components';
import { StatusBadge } from '../battlefield/status-badge';

interface SwitchPanelProps {
  battle: Battle;
  onSwitchSelect: (choice: string) => void;
  disabled?: boolean;
}

export function SwitchPanel({
  battle,
  onSwitchSelect,
  disabled,
}: SwitchPanelProps) {
  const request = battle.request;
  if (!request || !request.side) return null;

  const sidePokemons = request.side.pokemon;

  return (
    <div className="space-y-2">
      {sidePokemons.map((poke, index) => {
        const isActive = poke.active;
        const [hpText] = poke.condition.split(' ');
        const [current, max] = hpText.split('/').map(Number);
        const isFainted = poke.condition === '0 fnt' || current === 0;
        const isDisabled = isActive || isFainted || disabled;

        const icon = Icons.getPokemon(poke.details.split(',')[0]);

        // Extract status from condition string (e.g., "100/100 brn")
        const parts = poke.condition.split(' ');
        const statusStr = parts.length > 1 && parts[1] !== 'fnt' ? parts[1] : null;
        const status = statusStr as StatusName | null;

        const hpPct = max > 0 ? Math.round((current / max) * 100) : 0;
        const hpColor =
          hpPct > 50
            ? 'bg-emerald-500'
            : hpPct > 25
              ? 'bg-yellow-500'
              : 'bg-red-500';

        return (
          <Button
            key={poke.ident}
            variant="outline"
            className={`w-full h-auto py-2 px-3 justify-start gap-3 ${
              isActive ? 'border-primary/50 bg-primary/5' : ''
            } ${isFainted ? 'opacity-40' : ''}`}
            disabled={isDisabled}
            onClick={() => onSwitchSelect(`switch ${index + 1}`)}
          >
            <span style={{ ...icon.css }} className="shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-sm truncate">
                  {poke.details.split(',')[0]}
                </span>
                {isActive && (
                  <Badge variant="outline" className="text-xs">
                    Active
                  </Badge>
                )}
                {isFainted && (
                  <Badge variant="outline" className="text-xs opacity-60">
                    Fainted
                  </Badge>
                )}
                <StatusBadge status={status} />
              </div>
              {!isFainted && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${hpColor}`}
                      style={{ width: `${hpPct}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {hpPct}%
                  </span>
                </div>
              )}
            </div>
          </Button>
        );
      })}
    </div>
  );
}
