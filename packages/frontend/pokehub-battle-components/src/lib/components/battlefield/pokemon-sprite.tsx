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
    <div
      className={`relative flex items-center justify-center transition-opacity duration-300 ${
        fainted ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <Image
        src={sprite.url}
        alt={species}
        width={sprite.w}
        height={sprite.h}
        unoptimized={sprite.url.endsWith('.gif')}
        style={sprite.pixelated ? { imageRendering: 'pixelated' } : undefined}
        className="drop-shadow-lg"
      />
    </div>
  );
}
