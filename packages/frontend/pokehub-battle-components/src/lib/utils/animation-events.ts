import type { Battle } from '@pkmn/client';
import type { ArgType } from '@pkmn/protocol';
import type { AnimationEvent } from '../types/animation.types';

/**
 * Extract animation events from a single protocol message.
 *
 * Called BEFORE battle.add() so we can read the previous HP for damage deltas.
 * The args array follows @pkmn/protocol format: [command, ...params].
 */
export function extractAnimationEvent(
  args: ArgType,
  battle: Battle
): AnimationEvent | null {
  const cmd = str(args[0]);

  switch (cmd) {
    case 'move': {
      const attacker = str(args[1]);
      const moveName = str(args[2]);
      const defender = str(args[3]) || attacker;
      return { type: 'move', attacker, defender, moveName };
    }

    case '-damage': {
      const ident = str(args[1]);
      const pokemon = findPokemon(battle, ident);
      const prevHp = pokemon?.hp ?? 0;
      const maxHp = pokemon?.maxhp ?? 100;
      const newHp = parseHp(str(args[2]));
      return { type: 'damage', pokemon: ident, prevHp, newHp, maxHp };
    }

    case '-heal': {
      const ident = str(args[1]);
      const pokemon = findPokemon(battle, ident);
      const prevHp = pokemon?.hp ?? 0;
      const maxHp = pokemon?.maxhp ?? 100;
      const newHp = parseHp(str(args[2]));
      return { type: 'heal', pokemon: ident, prevHp, newHp, maxHp };
    }

    case 'faint':
      return { type: 'faint', pokemon: str(args[1]) };

    case 'switch':
    case 'drag': {
      const ident = str(args[1]);
      const details = str(args[2]);
      const species = details.split(',')[0].trim();
      return { type: 'switch-in', pokemon: ident, species };
    }

    case '-boost':
      return {
        type: 'boost',
        pokemon: str(args[1]),
        stat: str(args[2]),
        amount: parseInt(str(args[3]) || '1', 10),
      };

    case '-unboost':
      return {
        type: 'unboost',
        pokemon: str(args[1]),
        stat: str(args[2]),
        amount: parseInt(str(args[3]) || '1', 10),
      };

    case '-status':
      return { type: 'status', pokemon: str(args[1]), status: str(args[2]) };

    case '-weather': {
      const weather = str(args[1]);
      if (weather === 'none') return null;
      return { type: 'weather', weather };
    }

    case '-fieldstart': {
      const effect = str(args[1]);
      const terrain = effect.replace(/^move:\s*/, '');
      if (terrain.includes('Terrain')) {
        return { type: 'terrain', terrain };
      }
      return null;
    }

    case '-supereffective':
      return { type: 'supereffective' };

    case '-resisted':
      return { type: 'resisted' };

    case '-crit':
      return { type: 'crit' };

    // A move that failed to connect: missed (accuracy), failed (own
    // mechanics, e.g. Substitute already up), immune (type/ability), or
    // notarget (Gen 1-4 only — Gen 9+ uses -fail). All share one handler
    // so the move SFX is suppressed and a brief beat plays.
    case '-miss':
    case '-fail':
    case '-immune':
    case '-notarget':
      return { type: 'move-failed' };

    default:
      return null;
  }
}

/** Safely convert a protocol arg to string */
function str(val: unknown): string {
  return val == null ? '' : String(val);
}

/**
 * Parse HP from protocol format "current/max" or just a number.
 * Returns the current HP as a number.
 */
function parseHp(hpStr: string): number {
  const cleaned = hpStr.split(' ')[0]; // Remove status suffix like "50/100 brn"
  const parts = cleaned.split('/');
  return parseInt(parts[0], 10) || 0;
}

/**
 * Find a Pokemon on the battle field by its ident string.
 * Ident format: "p1a: Charizard" or "p2a: Blastoise"
 */
function findPokemon(battle: Battle, ident: string) {
  const sideId = ident.startsWith('p1') ? 'p1' : 'p2';
  const side = battle[sideId];
  // In singles, active[0] is the only slot
  const active = side?.active[0];
  if (active && ident.includes(active.name)) return active;
  return active; // Fallback to active slot
}
