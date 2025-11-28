import type {
  AbilityName,
  GenerationNum,
  Item,
  ItemName,
  MoveName,
  NatureName,
  Species,
  StatID,
} from '@pkmn/dex';
import { Dex, type SpeciesName, type ID } from '@pkmn/dex';
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

export function getPokemonAbilitiesDetailsFromSpecies(
  species: Species,
  generation?: GenerationNum
) {
  const abilities = [
    species.abilities[0],
    species.abilities[1],
    species.abilities.S,
    species.abilities.H,
  ].filter((ability) => typeof ability === 'string');

  return getPokemonAbilitiesDetails(abilities, generation);
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
  if (!moveDetails.exists) {
    return undefined;
  }
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

export function getItems(generation?: GenerationNum): Item[] {
  const moddedDex = getModdedDex(generation);
  const items = moddedDex.items.all();
  return items as Item[];
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

export function getNatures(generation?: GenerationNum) {
  const moddedDex = getModdedDex(generation);
  const natures = moddedDex.natures.all();
  return natures;
}

export const getNatureDescription = (
  nature: NatureName,
  generation?: GenerationNum
) => {
  const natureDetails = getNatureDetails(nature, generation);
  const statIncrease = natureDetails?.plus;
  const statDecrease = natureDetails?.minus;

  if (statIncrease && statDecrease) {
    return `Increases ${getStatName(
      statIncrease
    )} while decreasing ${getStatName(statDecrease)}.`;
  }
  return 'No stat changes.';
};

export function getStatName(statId: StatID, generation?: GenerationNum) {
  const moddedDex = getModdedDex(generation);
  return moddedDex.stats.names[statId];
}

export function getStats(generation?: GenerationNum) {
  const moddedDex = getModdedDex(generation);
  return moddedDex.stats.ids();
}

export function getAllPokemonSpecies(gen: GenerationNum) {
  const moddedDex = getModdedDex(gen);
  const filteredSpecies: Species[] = [];

  moddedDex.species.all().forEach((species) => {
    if (!species.baseSpecies || isBaseForme(species)) {
      filteredSpecies.push(species);
    }
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
