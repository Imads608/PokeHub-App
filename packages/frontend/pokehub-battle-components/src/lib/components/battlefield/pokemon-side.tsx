'use client';

import type { Pokemon } from '@pkmn/client';
import type { Generation } from '@pkmn/data';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@pokehub/frontend/shared-ui-components';
import { HPBar } from './hp-bar';
import { PokemonSprite } from './pokemon-sprite';
import { StatStages } from './stat-stages';
import { StatusBadge } from './status-badge';
import { VolatileBadges } from './volatile-badges';

interface PokemonSideProps {
  pokemon: Pokemon | null;
  gen: Generation;
  isOpponent: boolean;
}

function InfoTooltip({
  name,
  description,
  children,
}: {
  name: string;
  description: string | undefined;
  children: React.ReactNode;
}) {
  if (!description) return <>{children}</>;

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <span className="cursor-help border-b border-dotted border-muted-foreground/30">
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="bg-popover/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-xl p-2.5 max-w-[240px]"
      >
        <p className="font-semibold text-xs">{name}</p>
        <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
          {description}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

export function PokemonSide({ pokemon, gen, isOpponent }: PokemonSideProps) {
  if (!pokemon) return null;

  const abilityRevealed = !!pokemon.ability;
  const itemRevealed = !!pokemon.item;

  // Look up display-friendly names and descriptions from the dex
  const abilityData = abilityRevealed
    ? gen.abilities.get(pokemon.ability)
    : undefined;
  const itemData = itemRevealed
    ? gen.items.get(pokemon.item)
    : undefined;

  const abilityName = abilityData?.name ?? (abilityRevealed ? pokemon.ability : null);
  const itemName = itemData?.name ?? (itemRevealed ? pokemon.item : null);

  return (
    <div
      className={`flex items-end gap-4 ${
        isOpponent ? 'flex-row' : 'flex-row-reverse'
      }`}
    >
      {/* Pokemon sprite */}
      <PokemonSprite
        species={pokemon.baseSpeciesForme}
        isBack={!isOpponent}
        shiny={pokemon.shiny}
        gender={pokemon.gender}
        fainted={pokemon.fainted}
      />

      {/* Nameplate: Name, level, status, HP */}
      <div className="rounded-xl border border-border/60 bg-card/90 backdrop-blur-sm px-4 py-2.5 shadow-md min-w-[180px]">
        <div className={`flex items-center gap-1.5 flex-wrap ${isOpponent ? 'justify-end' : ''}`}>
          <span className="font-bold text-sm tracking-tight">
            {pokemon.name || pokemon.baseSpeciesForme}
          </span>
          <span className="text-[11px] text-muted-foreground font-medium">
            Lv.{pokemon.level}
          </span>
          {pokemon.gender !== 'N' && (
            <span
              className={`text-xs font-bold ${
                pokemon.gender === 'M' ? 'text-blue-400' : 'text-pink-400'
              }`}
            >
              {pokemon.gender === 'M' ? '\u2642' : '\u2640'}
            </span>
          )}
          <StatusBadge status={pokemon.status} />
          <VolatileBadges volatiles={pokemon.volatiles} />
        </div>

        {/* Ability + Item (shown when revealed by protocol) */}
        {(abilityRevealed || itemRevealed) && (
          <div className={`text-[11px] text-muted-foreground/70 mt-0.5 truncate ${isOpponent ? 'text-right' : ''}`}>
            {abilityName && (
              <InfoTooltip name={abilityName} description={abilityData?.shortDesc}>
                <span className="italic">{abilityName}</span>
              </InfoTooltip>
            )}
            {abilityName && itemName && (
              <span> · </span>
            )}
            {itemName && (
              <InfoTooltip name={itemName} description={itemData?.shortDesc}>
                <span>{itemName}</span>
              </InfoTooltip>
            )}
          </div>
        )}

        <div className="mt-1.5 w-full">
          <HPBar current={pokemon.hp} max={pokemon.maxhp} />
        </div>

        {/* Stat stages */}
        <div className="mt-1">
          <StatStages boosts={pokemon.boosts} />
        </div>
      </div>
    </div>
  );
}
