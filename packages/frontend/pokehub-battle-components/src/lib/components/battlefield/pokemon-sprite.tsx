'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { GenderName } from '@pkmn/dex';
import { Sprites } from '@pkmn/img';
import { motion } from 'motion/react';
import Image from 'next/image';
import type { SpriteTransform } from '../../types/animation.types';
import { SPRITE_TRANSFORM_RESET } from '../../types/animation.types';

interface PokemonSpriteProps {
  species: string;
  isBack?: boolean;
  shiny?: boolean;
  gender?: GenderName;
  fainted?: boolean;
  /** Pokemon ident for animation targeting (e.g. "p1a: Charizard") */
  ident?: string;
  /** Callback to register this sprite with the animation system */
  onRegister?: (ident: string, handle: {
    ident: string;
    getRect: () => DOMRect | null;
    setTransform: (t: SpriteTransform) => void;
  }) => void;
  /** Callback to unregister */
  onUnregister?: (ident: string) => void;
}

export function PokemonSprite({
  species,
  isBack = false,
  shiny = false,
  gender,
  fainted = false,
  ident,
  onRegister,
  onUnregister,
}: PokemonSpriteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransformState] = useState<SpriteTransform>(SPRITE_TRANSFORM_RESET);

  const sprite = Sprites.getPokemon(species, {
    gen: 'ani',
    side: isBack ? 'p1' : 'p2',
    shiny,
    gender,
  });

  const setTransform = useCallback((t: SpriteTransform) => {
    setTransformState((prev) => ({ ...prev, ...t }));
  }, []);

  // Register with animation system and reset transform for new Pokemon
  useEffect(() => {
    if (!ident || !onRegister) return;

    setTransformState(SPRITE_TRANSFORM_RESET);

    onRegister(ident, {
      ident,
      getRect: () => containerRef.current?.getBoundingClientRect() ?? null,
      setTransform,
    });

    return () => {
      onUnregister?.(ident);
    };
  }, [ident, species, onRegister, onUnregister, setTransform]);

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center"
      data-pokemon-ident={ident}
    >
      {/* Pokemon sprite — animated via Motion */}
      <motion.div
        animate={{
          x: transform.x ?? 0,
          y: fainted ? 16 : (transform.y ?? 0),
          scale: fainted ? 0.9 : (transform.scale ?? 1),
          rotate: transform.rotate ?? 0,
          opacity: fainted ? 0 : (transform.opacity ?? 1),
          filter: `brightness(${transform.brightness ?? 1})`,
        }}
        transition={{
          duration: 0.4,
          ease: [0.2, 0, 0, 1],
        }}
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
      </motion.div>

      {/* Platform shadow */}
      <motion.div
        animate={{ opacity: fainted ? 0 : 1 }}
        transition={{ duration: 0.5 }}
        className="-mt-2 h-3 w-24 rounded-[50%] bg-black/20 blur-sm"
      />
    </div>
  );
}
