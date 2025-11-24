import type {
  AbilityName,
  GenerationNum,
  ItemName,
  MoveName,
  SpeciesName,
} from '@pkmn/dex';
import {
  getAbilityDetails,
  getItemDetails,
  getMoveDetails,
  getPokemonDetailsByName,
} from '@pokehub/frontend/dex-data-provider';
import { getFormatRules } from '@pokehub/shared/pokemon-showdown-validation';
import { useMemo } from 'react';

/**
 * Returns a Set of banned Pokemon names for the given format.
 * Checks both tier-based bans (e.g., "UUBL") and specific Pokemon bans.
 */
export function useBannedPokemon(
  showdownFormatId: string,
  generation: GenerationNum
): Set<string> {
  return useMemo(() => {
    const formatRules = getFormatRules(showdownFormatId);
    if (!formatRules || formatRules.banlist.length === 0) {
      return new Set<string>();
    }

    const banned = new Set<string>();

    formatRules.banlist.forEach((ban) => {
      // Check if ban is a specific Pokemon
      const bannedSpecies = getPokemonDetailsByName(
        ban as SpeciesName,
        generation
      );
      if (bannedSpecies) {
        banned.add(bannedSpecies.name);
      } else {
        // If not a Pokemon, it might be a tier marker (e.g., "UUBL")
        // Store it as-is for tier matching
        banned.add(ban);
      }
    });

    return banned;
  }, [showdownFormatId, generation]);
}

/**
 * Returns a Set of banned move names for the given format.
 */
export function useBannedMoves(
  showdownFormatId: string,
  generation: GenerationNum
): Set<MoveName> {
  return useMemo(() => {
    const formatRules = getFormatRules(showdownFormatId);
    if (!formatRules || formatRules.banlist.length === 0) {
      return new Set<MoveName>();
    }

    const banned = new Set<MoveName>();
    formatRules.banlist.forEach((ban) => {
      const moveDetails = getMoveDetails(ban as MoveName, generation);
      if (moveDetails) {
        banned.add(moveDetails.name);
      }
    });

    return banned;
  }, [showdownFormatId, generation]);
}

/**
 * Returns a Set of banned ability names for the given format.
 */
export function useBannedAbilities(
  showdownFormatId: string,
  generation: GenerationNum
): Set<AbilityName> {
  return useMemo(() => {
    const formatRules = getFormatRules(showdownFormatId);
    if (!formatRules || formatRules.banlist.length === 0) {
      return new Set<AbilityName>();
    }

    const banned = new Set<AbilityName>();
    formatRules.banlist.forEach((ban) => {
      const abilityDetails = getAbilityDetails(ban as AbilityName, generation);
      if (abilityDetails) {
        banned.add(abilityDetails.name);
      }
    });

    return banned;
  }, [showdownFormatId, generation]);
}

/**
 * Returns a Set of banned item names for the given format.
 */
export function useBannedItems(
  showdownFormatId: string,
  generation: GenerationNum
): Set<ItemName> {
  return useMemo(() => {
    const formatRules = getFormatRules(showdownFormatId);
    if (!formatRules || formatRules.banlist.length === 0) {
      return new Set<ItemName>();
    }

    const banned = new Set<ItemName>();
    formatRules.banlist.forEach((ban) => {
      const itemDetails = getItemDetails(ban as ItemName, generation);
      if (itemDetails) {
        banned.add(itemDetails.name);
      }
    });

    return banned;
  }, [showdownFormatId, generation]);
}
