import type { MoveAnimFn } from '../types/animation.types';
import { resolveTemplate } from './move-templates';
import type { MoveAnimConfig } from '@pokehub/shared/pokemon-battle-types';

/**
 * Move animation registry with lazy loading.
 *
 * Lookup order:
 *   1. Cache (previously resolved MoveAnimFn)
 *   2. Lazy registry (code-split hand-written animations)
 *   3. Server-delivered configs
 *   4. null (generic fallback handles it)
 */

type LazyMoveAnim = () => Promise<{ default: MoveAnimFn }>;

const registry = new Map<string, LazyMoveAnim>();
const cache = new Map<string, MoveAnimFn>();
const serverConfigs = new Map<string, MoveAnimConfig>();

function normalizeMoveName(name: string): string {
  return name.toLowerCase().replace(/[\s-]/g, '');
}

export function registerMoveAnimation(moveId: string, loader: LazyMoveAnim) {
  const key = normalizeMoveName(moveId);
  if (registry.has(key)) return; // first registration wins
  registry.set(key, loader);
}

/**
 * Load move animation configs received from the server via BATTLE_START.
 * Called once per battle — only includes moves for the player's own team.
 * Clears both the resolved animation cache and server configs so animations
 * from previous battles don't accumulate in memory.
 */
export function loadServerMoveConfigs(
  configs: Record<string, MoveAnimConfig>
): void {
  cache.clear();
  serverConfigs.clear();
  for (const [key, value] of Object.entries(configs)) {
    serverConfigs.set(key, value);
  }
}

/**
 * Get the animation for a move. Returns null if no specific animation exists.
 */
export async function getMoveAnimation(
  moveName: string
): Promise<MoveAnimFn | null> {
  const key = normalizeMoveName(moveName);

  // 1. Check cache (previously resolved animation)
  const cached = cache.get(key);
  if (cached) return cached;

  // 2. Check lazy registry (hand-written custom animations)
  const loader = registry.get(key);
  if (loader) {
    try {
      const mod = await loader();
      cache.set(key, mod.default);
      return mod.default;
    } catch {
      // If the chunk fails to load, fall through
    }
  }

  // 3. Check server-delivered configs (template resolved lazily)
  const serverEntry = serverConfigs.get(key);
  if (serverEntry) {
    const anim = resolveTemplate(serverEntry);
    return anim;
  }

  return null;
}

// ── Register hand-written move animations (lazy imports) ────────────────
// Each entry adds ~50 bytes to the registry. The actual animation code
// is only downloaded when that move is first used in battle.

// Physical moves
registerMoveAnimation('earthquake', () => import('./move-anims/earthquake'));
registerMoveAnimation('closecombat', () => import('./move-anims/close-combat'));
registerMoveAnimation('uturn', () => import('./move-anims/u-turn'));
registerMoveAnimation('knockoff', () => import('./move-anims/knock-off'));

// Special moves
registerMoveAnimation(
  'flamethrower',
  () => import('./move-anims/flamethrower')
);
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
