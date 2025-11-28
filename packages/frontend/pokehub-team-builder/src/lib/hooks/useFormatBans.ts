import { useFormatRules } from './useFormatRules';
import type {
  AbilityName,
  GenerationNum,
  ItemName,
  MoveName,
  SpeciesName,
  Species,
} from '@pkmn/dex';
import {
  getAbilityDetails,
  getItemDetails,
  getMoveDetails,
  getPokemonDetailsByName,
} from '@pokehub/frontend/dex-data-provider';
import { useMemo } from 'react';

export interface BannedItemsResult<T> {
  data: Set<T | string>;
  isLoading: boolean;
}

/**
 * Generic helper to extract banned items of a specific type from format rules
 */
function useBannedItemsOfType<T>(
  formatId: string,
  generation: GenerationNum,
  checker: (ban: string, gen: GenerationNum) => T | null,
  includeNonMatches = false
): BannedItemsResult<T> {
  const { data: formatRules, isLoading } = useFormatRules(formatId);

  const data = useMemo(() => {
    if (!formatRules?.completeBanlist.length) {
      return new Set<T | string>();
    }

    const banned = new Set<T | string>();
    formatRules.completeBanlist.forEach((ban) => {
      const item = checker(ban, generation);
      if (item) {
        banned.add(item as T);
      } else if (includeNonMatches) {
        // For Pokemon, include tier markers like "UUBL"
        banned.add(ban);
      }
    });

    return banned;
  }, [formatRules, generation, checker, includeNonMatches]);

  return { data, isLoading };
}

/**
 * Returns a Set of banned Pokemon names for the given format.
 * Checks both tier-based bans (e.g., "UUBL") and specific Pokemon bans.
 */
export function useBannedPokemon(
  showdownFormatId: string,
  generation: GenerationNum
): BannedItemsResult<string> {
  return useBannedItemsOfType(
    showdownFormatId,
    generation,
    (ban, gen) => {
      const species = getPokemonDetailsByName(ban as SpeciesName, gen);
      return species?.name || null;
    },
    true // Include non-Pokemon (tier markers)
  );
}

/**
 * Returns a Set of banned move names for the given format.
 */
export function useBannedMoves(
  showdownFormatId: string,
  generation: GenerationNum
): BannedItemsResult<MoveName> {
  return useBannedItemsOfType(showdownFormatId, generation, (ban, gen) => {
    const move = getMoveDetails(ban as MoveName, gen);
    return move?.name || null;
  }) as BannedItemsResult<MoveName>;
}

/**
 * Returns a Set of banned ability names for the given format.
 */
export function useBannedAbilities(
  showdownFormatId: string,
  generation: GenerationNum
): BannedItemsResult<AbilityName> {
  return useBannedItemsOfType(showdownFormatId, generation, (ban, gen) => {
    const ability = getAbilityDetails(ban as AbilityName, gen);
    return ability?.name || null;
  }) as BannedItemsResult<AbilityName>;
}

/**
 * Returns a Set of banned item names for the given format.
 */
export function useBannedItems(
  showdownFormatId: string,
  generation: GenerationNum
): BannedItemsResult<ItemName> {
  return useBannedItemsOfType(showdownFormatId, generation, (ban, gen) => {
    const item = getItemDetails(ban as ItemName, gen);
    return item?.name || null;
  }) as BannedItemsResult<ItemName>;
}

/**
 * Filters a list of Pokemon based on format bans and illegal tiers
 * @param unfilteredPokemon - List of all Pokemon to filter
 * @param showdownFormatId - Format ID to get bans for
 * @param generation - Generation number
 * @param isDoubles - Whether this is a doubles format
 * @returns Filtered Pokemon list and loading state
 */
export function useBannedAndIllegalPokemon(
  unfilteredPokemon: Species[],
  showdownFormatId: string,
  generation: GenerationNum,
  isDoubles: boolean
): { data: Species[]; isLoading: boolean } {
  const { data: bannedPokemon, isLoading } = useBannedPokemon(
    showdownFormatId,
    generation
  );

  const data = useMemo(() => {
    // Don't filter if bans are still loading
    if (isLoading) {
      return [];
    }

    return unfilteredPokemon.filter((pokemon) => {
      // Check if Pokemon's tier is banned
      const tierValue = isDoubles ? pokemon.doublesTier : pokemon.tier;

      // Filter out Illegal tier Pokemon
      if (tierValue === 'Illegal') {
        return false;
      }

      if (bannedPokemon.has(tierValue)) {
        return false;
      }

      // Check if this specific Pokemon is banned
      if (bannedPokemon.has(pokemon.name)) {
        return false;
      }

      return true;
    });
  }, [unfilteredPokemon, bannedPokemon, isDoubles, isLoading]);

  return { data, isLoading };
}
