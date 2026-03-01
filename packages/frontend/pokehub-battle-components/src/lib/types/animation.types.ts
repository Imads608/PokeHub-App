import type { Transition } from 'motion/react';

// ── Animation Events (extracted from protocol) ─────────────────────────

export type AnimationEvent =
  | { type: 'move'; attacker: string; defender: string; moveName: string }
  | { type: 'damage'; pokemon: string; prevHp: number; newHp: number; maxHp: number; skipHitSfx?: boolean }
  | { type: 'heal'; pokemon: string; prevHp: number; newHp: number; maxHp: number }
  | { type: 'faint'; pokemon: string }
  | { type: 'switch-out'; pokemon: string }
  | { type: 'switch-in'; pokemon: string; species: string }
  | { type: 'boost'; pokemon: string; stat: string; amount: number }
  | { type: 'unboost'; pokemon: string; stat: string; amount: number }
  | { type: 'status'; pokemon: string; status: string }
  | { type: 'weather'; weather: string }
  | { type: 'terrain'; terrain: string }
  | { type: 'supereffective' }
  | { type: 'resisted' }
  | { type: 'crit' }
  | { type: 'miss' };

// ── Sprite handles (for positioning and transforms) ─────────────────────

export interface SpriteTransform {
  x?: number;
  y?: number;
  scale?: number;
  rotate?: number;
  opacity?: number;
  /** CSS brightness filter (1 = normal, 0 = black, 5+ = white flash) */
  brightness?: number;
}

export const SPRITE_TRANSFORM_RESET: SpriteTransform = {
  x: 0,
  y: 0,
  scale: 1,
  rotate: 0,
  opacity: 1,
  brightness: 1,
};

/** Reference to a Pokemon sprite for animation targeting */
export interface SpriteHandle {
  /** Pokemon ident (e.g. "p1: Charizard") */
  ident: string;
  /** Get the DOM element's bounding rect */
  getRect: () => DOMRect | null;
  /** Apply a transform to the sprite */
  setTransform: (transform: SpriteTransform) => void;
}

// ── Effect sprites (temporary FX elements) ──────────────────────────────

export interface EffectSpriteConfig {
  /** Unique key for React reconciliation */
  id: string;
  /** Sprite name from Showdown CDN (e.g. "fireball", "icicle") or a full URL */
  sprite: string;
  /** Start position relative to arena container */
  startX: number;
  startY: number;
  /** End position relative to arena container */
  endX: number;
  endY: number;
  /** Size */
  width?: number;
  height?: number;
  /** Motion transition config */
  transition?: Transition;
  /** How the sprite exits */
  exit?: 'fade' | 'explode';
  /** Optional tint color (CSS color value) */
  tint?: string;
}

// ── Animation scene (passed to move animation functions) ────────────────

export interface AnimationScene {
  /** The arena container element */
  arenaRef: React.RefObject<HTMLDivElement | null>;
  /** Get a sprite handle by pokemon ident */
  getSprite: (ident: string) => SpriteHandle | null;
  /** Show a temporary effect sprite. Resolves when the transition completes and auto-removes the effect. */
  showEffect: (config: EffectSpriteConfig) => Promise<void>;
  /** Show a floating text popup (e.g. damage number, "Critical hit!") */
  showPopup: (config: PopupConfig) => void;
  /** Shake the arena container */
  shakeScreen: (intensity?: number, duration?: number) => Promise<void>;
  /** Flash a color overlay on the arena */
  flashOverlay: (color: string, duration?: number) => Promise<void>;
  /** Wait for a duration */
  delay: (ms: number) => Promise<void>;
}

export interface PopupConfig {
  id: string;
  text: string;
  /** Sprite handle for positioning — caller resolves via scene.getSprite() */
  sprite: SpriteHandle | null;
  color?: string;
  duration?: number;
}

// ── Move animation function signature ───────────────────────────────────

export type MoveAnimFn = (
  scene: AnimationScene,
  attacker: SpriteHandle,
  defender: SpriteHandle
) => Promise<void>;
