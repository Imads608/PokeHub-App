'use client';

import { motion, AnimatePresence } from 'motion/react';
import type { PopupConfig } from '../../types/animation.types';
import { useAnimationContext } from '../../context/animation.context';

interface PopupLayerProps {
  popups: PopupConfig[];
}

/**
 * Renders floating text popups (damage numbers, stat changes, etc.)
 * above the targeted Pokemon sprite.
 */
export function PopupLayer({ popups }: PopupLayerProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      <AnimatePresence>
        {popups.map((popup) => (
          <DamagePopup key={popup.id} config={popup} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function DamagePopup({ config }: { config: PopupConfig }) {
  const { arenaRef } = useAnimationContext();

  const style: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '40%',
    transform: 'translateX(-50%)',
    color: config.color ?? '#ffffff',
    textShadow: '0 2px 8px rgba(0,0,0,0.6), 0 0 4px rgba(0,0,0,0.4)',
  };

  // Position above the target sprite using its handle
  const spriteRect = config.sprite?.getRect();
  const arenaRect = arenaRef.current?.getBoundingClientRect();
  if (spriteRect && arenaRect) {
    style.left = `${spriteRect.x + spriteRect.width / 2 - arenaRect.x}px`;
    style.top = `${spriteRect.y - arenaRect.y - 10}px`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 0, scale: 0.8 }}
      animate={{ opacity: 1, y: -30, scale: 1 }}
      exit={{ opacity: 0, y: -60, scale: 0.9 }}
      transition={{ duration: (config.duration ?? 800) / 1000, ease: [0, 0, 0.2, 1] }}
      style={style}
      className="text-lg font-black tabular-nums"
    >
      {config.text}
    </motion.div>
  );
}
