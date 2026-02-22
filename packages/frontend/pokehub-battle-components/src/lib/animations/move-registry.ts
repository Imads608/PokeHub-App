import type { MoveAnimFn } from '../types/animation.types';

/**
 * Move animation registry with lazy loading.
 *
 * Each move maps to a dynamic import that loads only when that move is first used.
 * This keeps the initial bundle small — only the registry map + generic fallbacks
 * are included. Individual move animations are code-split into separate chunks.
 *
 * Scales to 900+ moves without impacting bundle size.
 */

type LazyMoveAnim = () => Promise<{ default: MoveAnimFn }>;

const registry = new Map<string, LazyMoveAnim>();
const cache = new Map<string, MoveAnimFn>();

function normalizeMoveName(name: string): string {
  return name.toLowerCase().replace(/[\s\-]/g, '');
}

export function registerMoveAnimation(moveId: string, loader: LazyMoveAnim) {
  registry.set(normalizeMoveName(moveId), loader);
}

/**
 * Get the animation for a move. Returns null if no specific animation exists.
 * Loads the animation chunk on first use and caches it for subsequent calls.
 */
export async function getMoveAnimation(moveName: string): Promise<MoveAnimFn | null> {
  const key = normalizeMoveName(moveName);

  // Check cache first
  const cached = cache.get(key);
  if (cached) return cached;

  // Check registry for a lazy loader
  const loader = registry.get(key);
  if (!loader) return null;

  try {
    const mod = await loader();
    cache.set(key, mod.default);
    return mod.default;
  } catch {
    // If the chunk fails to load, fall back to generic
    return null;
  }
}

// ── Register move animations (lazy imports) ─────────────────────────────
// Each entry adds ~50 bytes to the registry. The actual animation code
// is only downloaded when that move is first used in battle.

// Physical moves
registerMoveAnimation('earthquake', () => import('./move-anims/earthquake'));
registerMoveAnimation('closecombat', () => import('./move-anims/close-combat'));
registerMoveAnimation('uturn', () => import('./move-anims/u-turn'));
registerMoveAnimation('knockoff', () => import('./move-anims/knock-off'));

// Special moves
registerMoveAnimation('flamethrower', () => import('./move-anims/flamethrower'));
registerMoveAnimation('thunderbolt', () => import('./move-anims/thunderbolt'));
registerMoveAnimation('icebeam', () => import('./move-anims/ice-beam'));
registerMoveAnimation('scald', () => import('./move-anims/scald'));
registerMoveAnimation('dracometeor', () => import('./move-anims/draco-meteor'));
registerMoveAnimation('surf', () => import('./move-anims/surf'));
registerMoveAnimation('moonblast', () => import('./move-anims/moonblast'));
registerMoveAnimation('shadowball', () => import('./move-anims/shadow-ball'));

// Status moves
registerMoveAnimation('stealthrock', () => import('./move-anims/stealth-rock'));
registerMoveAnimation('toxic', () => import('./move-anims/toxic'));
registerMoveAnimation('willowisp', () => import('./move-anims/will-o-wisp'));
registerMoveAnimation('swordsdance', () => import('./move-anims/swords-dance'));
registerMoveAnimation('dragondance', () => import('./move-anims/dragon-dance'));
registerMoveAnimation('calmmind', () => import('./move-anims/calm-mind'));
registerMoveAnimation('defog', () => import('./move-anims/defog'));
registerMoveAnimation('roost', () => import('./move-anims/roost'));
