'use client';

import type { Battle } from '@pkmn/client';
import type { StatusName } from '@pkmn/dex';
import { Icons } from '@pkmn/img';
import { Badge, Button } from '@pokehub/frontend/shared-ui-components';
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
    <div className="grid gap-2 sm:grid-cols-2">
      {sidePokemons.map((poke, index) => {
        const isActive = poke.active;
        const [hpText] = poke.condition.split(' ');
        const [current, max] = hpText.split('/').map(Number);
        const isFainted = poke.condition === '0 fnt' || current === 0;
        const isDisabled = isActive || isFainted || disabled;

        const species = poke.details.split(',')[0];
        const icon = Icons.getPokemon(species);

        // Extract status from condition string (e.g., "100/100 brn")
        const parts = poke.condition.split(' ');
        const statusStr = parts.length > 1 && parts[1] !== 'fnt' ? parts[1] : null;
        const status = statusStr as StatusName | null;

        const hpPct = max > 0 ? Math.round((current / max) * 100) : 0;
        const hpColor =
          hpPct > 50
            ? 'from-emerald-400 to-emerald-500'
            : hpPct > 25
              ? 'from-yellow-400 to-amber-500'
              : 'from-red-400 to-red-600';

        return (
          <Button
            key={poke.ident}
            variant="outline"
            className={`
              h-auto rounded-xl px-3 py-2.5 w-full justify-start gap-3
              transition-all duration-200
              ${isActive
                ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                : isFainted
                  ? 'border-border/40 bg-muted/30 opacity-50'
                  : 'hover:border-primary/30 hover:bg-card hover:shadow-md hover:scale-[1.01] active:scale-[0.99]'
              }
            `}
            disabled={isDisabled}
            onClick={() => onSwitchSelect(`switch ${index + 1}`)}
          >
            <span style={{ ...icon.css }} className="shrink-0" />
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm truncate">
                  {species}
                </span>
                {isActive && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-primary/40 text-primary">
                    Active
                  </Badge>
                )}
                {isFainted && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 opacity-60">
                    Fainted
                  </Badge>
                )}
                <StatusBadge status={status} />
              </div>
              {!isFainted && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-1.5 flex-1 rounded-full bg-black/20 overflow-hidden ring-1 ring-white/5">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${hpColor} transition-all duration-500`}
                      style={{ width: `${hpPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground tabular-nums font-medium">
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
