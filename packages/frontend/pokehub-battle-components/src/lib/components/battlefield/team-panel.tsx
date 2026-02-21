'use client';

import { StatusBadge } from './status-badge';
import type { Battle } from '@pkmn/client';
import type { StatusName } from '@pkmn/dex';
import { Icons } from '@pkmn/img';

interface TeamPanelProps {
  battle: Battle;
  /** Side ID ('p1' or 'p2') this panel represents */
  sideId: 'p1' | 'p2';
  /** Whether this panel represents the current user's team */
  isPlayer: boolean;
}

/**
 * Vertical team roster panel showing all Pokemon on a side.
 *
 * Player side: full info from request (HP, status, moves known).
 * Opponent side: revealed Pokemon with visible info, unrevealed slots as mystery entries.
 */
export function TeamPanel({ battle, sideId, isPlayer }: TeamPanelProps) {
  const side = battle[sideId];

  if (isPlayer) {
    return <PlayerTeamPanel battle={battle} />;
  }

  return <OpponentTeamPanel side={side} />;
}

// ── Player Panel ──────────────────────────────────────────────────────────

function PlayerTeamPanel({ battle }: { battle: Battle }) {
  const request = battle.request;
  if (!request?.side) return null;

  const pokemon = request.side.pokemon;

  return (
    <div className="flex flex-col gap-1">
      <div className="px-2 py-1.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          Your Team
        </span>
      </div>
      {pokemon.map((poke) => {
        const species = poke.details.split(',')[0];
        const icon = Icons.getPokemon(species);
        const [hpText] = poke.condition.split(' ');
        const [current, max] = hpText.split('/').map(Number);
        const isFainted = poke.condition === '0 fnt' || current === 0;
        const hpPct = max > 0 ? Math.round((current / max) * 100) : 0;

        // Extract status
        const parts = poke.condition.split(' ');
        const statusStr =
          parts.length > 1 && parts[1] !== 'fnt' ? parts[1] : null;
        const status = statusStr as StatusName | null;

        const hpColor =
          hpPct > 50
            ? 'bg-emerald-400'
            : hpPct > 25
            ? 'bg-amber-400'
            : 'bg-red-500';

        return (
          <div
            key={poke.ident}
            className={`
              group relative flex items-center gap-2 rounded-lg px-2 py-1.5
              transition-colors duration-200
              ${
                poke.active
                  ? 'bg-primary/10 ring-1 ring-primary/25'
                  : isFainted
                  ? 'opacity-40'
                  : 'hover:bg-muted/40'
              }
            `}
          >
            {/* Pokeball icon sprite */}
            <span
              style={{ ...icon.css, transform: 'scale(0.85)' }}
              className={`shrink-0 ${isFainted ? 'grayscale' : ''}`}
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span
                  className={`truncate text-xs font-semibold ${
                    isFainted ? 'text-muted-foreground line-through' : ''
                  }`}
                >
                  {species}
                </span>
                <StatusBadge status={status} />
              </div>

              {/* Thin HP bar */}
              {!isFainted && (
                <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-black/20">
                  <div
                    className={`h-full rounded-full ${hpColor} transition-all duration-500`}
                    style={{ width: `${hpPct}%` }}
                  />
                </div>
              )}
            </div>

            {/* HP percentage */}
            {!isFainted && (
              <span className="w-7 text-right text-[9px] font-medium tabular-nums text-muted-foreground">
                {hpPct}%
              </span>
            )}

            {/* Active indicator dot */}
            {poke.active && (
              <div className="absolute -left-0.5 top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Opponent Panel ────────────────────────────────────────────────────────

function OpponentTeamPanel({ side }: { side: Battle['p1'] }) {
  // searchid is set when a Pokemon has been switched in (real HP data).
  const revealed = side.team.filter((p) => p.searchid);

  // side.totalPokemon defaults to 6 until |teamsize| is processed.
  // During team preview, side.team is populated from |poke| lines — use
  // the smaller of totalPokemon and team.length to avoid overestimating.
  const totalPokemon =
    side.team.length > 0
      ? Math.min(side.totalPokemon, side.team.length)
      : side.totalPokemon;
  const unrevealedCount = Math.max(0, totalPokemon - revealed.length);

  return (
    <div className="flex flex-col gap-1">
      <div className="px-2 py-1.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          Opponent
        </span>
      </div>

      {/* Revealed Pokemon (switched in, real HP data) */}
      {revealed.map((pokemon) => {
        const species = pokemon.baseSpeciesForme;
        const icon = Icons.getPokemon(species);
        const isFainted = pokemon.fainted;
        const hpPct =
          pokemon.maxhp > 0
            ? Math.round((pokemon.hp / pokemon.maxhp) * 100)
            : 0;

        const hpColor =
          hpPct > 50
            ? 'bg-emerald-400'
            : hpPct > 25
            ? 'bg-amber-400'
            : 'bg-red-500';

        return (
          <div
            key={pokemon.searchid}
            className={`
              group relative flex items-center gap-2 rounded-lg px-2 py-1.5
              transition-colors duration-200
              ${
                pokemon === side.active[0]
                  ? 'bg-destructive/10 ring-1 ring-destructive/25'
                  : isFainted
                  ? 'opacity-40'
                  : 'hover:bg-muted/40'
              }
            `}
          >
            <span
              style={{ ...icon.css, transform: 'scale(0.85)' }}
              className={`shrink-0 ${isFainted ? 'grayscale' : ''}`}
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span
                  className={`truncate text-xs font-semibold ${
                    isFainted ? 'text-muted-foreground line-through' : ''
                  }`}
                >
                  {species}
                </span>
                <StatusBadge status={pokemon.status} />
              </div>

              {!isFainted && (
                <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-black/20">
                  <div
                    className={`h-full rounded-full ${hpColor} transition-all duration-500`}
                    style={{ width: `${hpPct}%` }}
                  />
                </div>
              )}
            </div>

            {!isFainted && (
              <span className="w-7 text-right text-[9px] font-medium tabular-nums text-muted-foreground">
                {hpPct}%
              </span>
            )}

            {pokemon === side.active[0] && (
              <div className="absolute -left-0.5 top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full bg-destructive" />
            )}
          </div>
        );
      })}

      {/* Unrevealed slots */}
      {Array.from({ length: unrevealedCount }).map((_, i) => (
        <div
          key={`unrevealed-${i}`}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 opacity-30"
        >
          <div className="flex h-[30px] w-[40px] shrink-0 items-center justify-center">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              className="text-muted-foreground"
            >
              <circle
                cx="12"
                cy="12"
                r="11"
                stroke="currentColor"
                strokeWidth="2"
              />
              <line
                x1="1"
                y1="12"
                x2="23"
                y2="12"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle
                cx="12"
                cy="12"
                r="3.5"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
            </svg>
          </div>
          <span className="text-xs italic text-muted-foreground">Unknown</span>
        </div>
      ))}
    </div>
  );
}
