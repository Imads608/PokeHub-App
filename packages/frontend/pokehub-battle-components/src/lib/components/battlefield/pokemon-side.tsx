'use client';

import type { Pokemon } from '@pkmn/client';
import { HPBar } from './hp-bar';
import { PokemonSprite } from './pokemon-sprite';
import { StatusBadge } from './status-badge';

interface PokemonSideProps {
  pokemon: Pokemon | null;
  isOpponent: boolean;
}

export function PokemonSide({ pokemon, isOpponent }: PokemonSideProps) {
  if (!pokemon) return null;

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
        <div className={`flex items-center gap-1.5 ${isOpponent ? 'justify-end' : ''}`}>
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
        </div>
        <div className="mt-1.5 w-full">
          <HPBar current={pokemon.hp} max={pokemon.maxhp} />
        </div>
      </div>
    </div>
  );
}
