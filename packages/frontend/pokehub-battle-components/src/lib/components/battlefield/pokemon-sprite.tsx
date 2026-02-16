'use client';

import type { GenderName } from '@pkmn/dex';
import { Sprites } from '@pkmn/img';
import Image from 'next/image';

interface PokemonSpriteProps {
  species: string;
  isBack?: boolean;
  shiny?: boolean;
  gender?: GenderName;
  fainted?: boolean;
}

export function PokemonSprite({
  species,
  isBack = false,
  shiny = false,
  gender,
  fainted = false,
}: PokemonSpriteProps) {
  const sprite = Sprites.getPokemon(species, {
    gen: 'ani',
    side: isBack ? 'p1' : 'p2',
    shiny,
    gender,
  });

  return (
    <div className="relative flex flex-col items-center">
      {/* Pokemon sprite */}
      <div
        className={`relative transition-all duration-500 ${
          fainted
            ? 'opacity-0 translate-y-4 scale-90'
            : 'opacity-100 translate-y-0 scale-100'
        }`}
      >
        <Image
          src={sprite.url}
          alt={species}
          width={sprite.w}
          height={sprite.h}
          unoptimized={sprite.url.endsWith('.gif')}
          style={sprite.pixelated ? { imageRendering: 'pixelated' } : undefined}
          className="drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
        />
      </div>

      {/* Platform shadow — elliptical ground shadow beneath the Pokemon */}
      <div
        className={`-mt-2 h-3 w-24 rounded-[50%] bg-black/20 blur-sm transition-opacity duration-500 ${
          fainted ? 'opacity-0' : 'opacity-100'
        }`}
      />
    </div>
  );
}
