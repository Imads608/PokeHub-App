'use client';

import { motion, AnimatePresence } from 'motion/react';
import type { EffectSpriteConfig } from '../../types/animation.types';

const SHOWDOWN_FX_BASE = 'https://play.pokemonshowdown.com/fx';

interface EffectLayerProps {
  effects: EffectSpriteConfig[];
}

/**
 * Renders all active effect sprites as an overlay layer within the arena.
 * Each sprite animates from startPos to endPos then exits.
 */
export function EffectLayer({ effects }: EffectLayerProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      <AnimatePresence>
        {effects.map((fx) => (
          <EffectSprite key={fx.id} config={fx} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function EffectSprite({ config }: { config: EffectSpriteConfig }) {
  const src = config.sprite.startsWith('http')
    ? config.sprite
    : `${SHOWDOWN_FX_BASE}/${config.sprite}.png`;

  const exitVariant =
    config.exit === 'explode'
      ? { opacity: 0, scale: 2.5 }
      : { opacity: 0 };

  return (
    <motion.img
      src={src}
      alt=""
      initial={{
        x: config.startX,
        y: config.startY,
        opacity: 0.9,
        scale: 1,
      }}
      animate={{
        x: config.endX,
        y: config.endY,
        opacity: 1,
        scale: 1,
      }}
      exit={exitVariant}
      transition={config.transition ?? { duration: 0.4, ease: [0, 0, 0.2, 1] }}
      style={{
        position: 'absolute',
        width: config.width ?? 40,
        height: config.height ?? 40,
        filter: config.tint ? `drop-shadow(0 0 6px ${config.tint})` : undefined,
        imageRendering: 'pixelated',
      }}
    />
  );
}
