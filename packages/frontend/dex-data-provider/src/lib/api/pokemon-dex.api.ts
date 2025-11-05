import type {
  AbilityName,
  GenerationNum,
  ItemName,
  MoveName,
  NatureName,
  Species,
  StatID,
  Tier,
} from '@pkmn/dex';
import { Dex, type SpeciesName, type ID } from '@pkmn/dex';
import {
  getSinglesBattleTierHierarchy,
  getDoublesBattleTierHierarchy,
} from '@pokehub/frontend/pokemon-static-data';
import { isBaseForme } from '@pokehub/frontend/shared-utils';

export function getAllPokemonTypes() {
  return Dex.types.all();
}

export function getPokemonDetails(id: ID, generation?: GenerationNum) {
  const moddedDex = getModdedDex(generation);

  const species = moddedDex.species.getByID(id);
  return species.exists ? species : undefined;
}

export function getPokemonDetailsByName(
  name: SpeciesName,
  generation?: GenerationNum
) {
  const moddedDex = getModdedDex(generation);

  const species = moddedDex.species.get(name);
  return species.exists ? species : undefined;
}

export function getPokemonAbilitiesDetails(
  abilities: string[],
  generation?: GenerationNum
) {
  const moddedDex = getModdedDex(generation);

  const abilitiesDetails = abilities.map((ability) => {
    const abilityData = moddedDex.abilities.get(ability);
    if (!abilityData.exists) {
      return undefined;
    }
    return abilityData;
  });

  return abilitiesDetails;
}

export function getAbilityDetails(
  ability: AbilityName,
  generation?: GenerationNum
) {
  const moddedDex = getModdedDex(generation);

  const abilityData = moddedDex.abilities.get(ability);
  if (!abilityData.exists) {
    return undefined;
  }
  return abilityData;
}

export function getMoveDetails(move: MoveName, generation?: GenerationNum) {
  const moddedDex = getModdedDex(generation);

  const moveDetails = moddedDex.moves.get(move);
  return moveDetails;
}

export function getItemDetails(itemName: ItemName, generation?: GenerationNum) {
  const moddedDex = getModdedDex(generation);
  const itemDetails = moddedDex.items.get(itemName);

  if (!itemDetails.exists) {
    return undefined;
  }
  return itemDetails;
}

export function getNatureDetails(
  nature: NatureName,
  generation?: GenerationNum
) {
  const moddedDex = getModdedDex(generation);
  const natureDetails = moddedDex.natures.get(nature);
  if (!natureDetails.exists) {
    return undefined;
  }
  return natureDetails;
}

export function getStatName(statId: StatID, generation?: GenerationNum) {
  const moddedDex = getModdedDex(generation);
  return moddedDex.stats.names[statId];
}

export function getStats(generation?: GenerationNum) {
  const moddedDex = getModdedDex(generation);
  return moddedDex.stats.ids();
}

export function getPokemonCompetitive(
  gen: GenerationNum,
  tier: Tier.Singles | Tier.Doubles
) {
  const moddedDex = getModdedDex(gen);
  const filteredSpecies: Species[] = [];

  // Determine if this is a singles or doubles tier by checking the id
  const isDoublesTier = tier.startsWith('D');
  const hierarchy = isDoublesTier
    ? getDoublesBattleTierHierarchy()
    : getSinglesBattleTierHierarchy();

  // Helper function to normalize tier (remove brackets)
  const normalizeTier = (tierString: string): string => {
    return tierString.replace(/[()]/g, '');
  };

  // Find the index of the selected tier in the hierarchy
  const normalizedSelectedTier = normalizeTier(tier);
  const selectedTierIndex = hierarchy.findIndex(
    (t) => normalizeTier(t) === normalizedSelectedTier
  );

  // Get all tiers from the selected tier onwards (lower in hierarchy)
  const allowedTiers =
    selectedTierIndex !== -1
      ? hierarchy.slice(selectedTierIndex).map((t) => normalizeTier(t))
      : [normalizedSelectedTier];

  moddedDex.species.all().forEach((species) => {
    const speciesTier = isDoublesTier ? species.doublesTier : species.tier;
    const normalizedSpeciesTier = normalizeTier(speciesTier);
    const tierMatch = allowedTiers.includes(normalizedSpeciesTier);

    if (tierMatch && (!species.baseSpecies || isBaseForme(species))) {
      filteredSpecies.push(species);
    }
  });

  // Sort by tier hierarchy (higher tiers first), then by Pokedex number
  filteredSpecies.sort((a, b) => {
    const aTier = isDoublesTier ? a.doublesTier : a.tier;
    const bTier = isDoublesTier ? b.doublesTier : b.tier;
    const aTierIndex = allowedTiers.indexOf(normalizeTier(aTier));
    const bTierIndex = allowedTiers.indexOf(normalizeTier(bTier));

    // Sort by tier first
    if (aTierIndex !== bTierIndex) {
      return aTierIndex - bTierIndex;
    }

    // If same tier, sort by Pokedex number
    return a.num - b.num;
  });

  return filteredSpecies;
}

function getModdedDex(generation?: GenerationNum) {
  if (generation) {
    return Dex.forGen(generation);
  } else {
    return Dex;
  }
}
