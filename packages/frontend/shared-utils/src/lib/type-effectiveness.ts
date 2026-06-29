import type { Generation } from '@pkmn/data';
import type { TypeName } from '@pkmn/dex';

/**
 * Calculates the type effectiveness multiplier for an attacking type
 * against a defending Pokemon's types using the generation's type chart.
 *
 * @returns The multiplier (0, 0.25, 0.5, 1, 2, 4) or null if types are unavailable
 */
export function getTypeEffectiveness(
  gen: Generation,
  attackingType: TypeName,
  defendingTypes: readonly TypeName[]
): number | null {
  if (defendingTypes.length === 0) return null;

  try {
    return gen.types.totalEffectiveness(attackingType, defendingTypes as TypeName[]);
  } catch {
    return null;
  }
}
