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

  const hpPercent =
    pokemon.maxhp > 0
      ? Math.round((pokemon.hp / pokemon.maxhp) * 100)
      : 0;

  return (
    <div className={`flex flex-col gap-2 ${isOpponent ? 'items-start' : 'items-end'}`}>
      {/* Info bar: name, level, status */}
      <div
        className={`flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 shadow-sm ${
          isOpponent ? 'flex-row' : 'flex-row-reverse'
        }`}
      >
        <div className={`flex flex-col ${isOpponent ? 'items-start' : 'items-end'}`}>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm">
              {pokemon.name || pokemon.baseSpeciesForme}
            </span>
            <span className="text-xs text-muted-foreground">
              Lv.{pokemon.level}
            </span>
            {pokemon.gender !== 'N' && (
              <span
                className={`text-xs font-bold ${
                  pokemon.gender === 'M' ? 'text-blue-500' : 'text-pink-500'
                }`}
              >
                {pokemon.gender === 'M' ? '\u2642' : '\u2640'}
              </span>
            )}
            <StatusBadge status={pokemon.status} />
          </div>
          <div className="w-36">
            <HPBar current={pokemon.hp} max={pokemon.maxhp} />
          </div>
        </div>
      </div>

      {/* Sprite */}
      <PokemonSprite
        species={pokemon.baseSpeciesForme}
        isBack={!isOpponent}
        shiny={pokemon.shiny}
        gender={pokemon.gender}
        fainted={pokemon.fainted}
      />
    </div>
  );
}
