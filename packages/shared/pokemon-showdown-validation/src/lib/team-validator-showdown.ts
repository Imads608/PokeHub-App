import type { PokemonSet, SpeciesName, MoveName, AbilityName, ItemName } from '@pkmn/dex';
import { Dex, TeamValidator } from '@pkmn/sim';
import type {
  PokemonInTeam,
  PokemonTeam,
} from '@pokehub/shared/pokemon-types';

/**
 * Validation result for a single Pokemon
 */
export interface PokemonValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validation result for an entire team
 */
export interface TeamValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  pokemonResults: Map<number, PokemonValidationResult>;
}

/**
 * Convert our PokemonInTeam to PokemonSet format that Showdown expects
 */
function toPokemonSet(pokemon: PokemonInTeam): PokemonSet {
  return {
    name: pokemon.name || pokemon.species,
    species: pokemon.species,
    item: pokemon.item || '',
    ability: pokemon.ability,
    moves: pokemon.moves.filter((m) => m !== ''),
    nature: pokemon.nature,
    gender: pokemon.gender,
    evs: pokemon.evs,
    ivs: pokemon.ivs,
    level: pokemon.level,
    shiny: pokemon.shiny,
    happiness: pokemon.happiness,
    hpType: pokemon.hpType,
    pokeball: pokemon.pokeball,
    gigantamax: pokemon.gigantamax,
  };
}

/**
 * Parse Showdown validation problems and associate them with Pokemon slots
 */
function parseValidationProblems(
  problems: string[],
  team: PokemonInTeam[]
): { errors: string[]; pokemonResults: Map<number, PokemonValidationResult> } {
  const errors: string[] = [];
  const pokemonResults = new Map<number, PokemonValidationResult>();

  // Initialize results for each Pokemon in the team (by their index position)
  team.forEach((_, index) => {
    pokemonResults.set(index, { isValid: true, errors: [], warnings: [] });
  });

  problems.forEach((problem) => {
    // Try to extract Pokemon slot from problem message
    // Showdown often formats problems like: "(pokemon 1) Pikachu's ability..."
    const slotMatch = problem.match(/\(pokemon (\d+)\)/i);

    if (slotMatch) {
      const slotIndex = parseInt(slotMatch[1], 10) - 1; // Convert to 0-indexed
      const cleanedProblem = problem.replace(/\(pokemon \d+\)\s*/i, '').trim();

      if (pokemonResults.has(slotIndex)) {
        const result = pokemonResults.get(slotIndex);
        if (result) {
          result.errors.push(cleanedProblem);
          result.isValid = false;
          pokemonResults.set(slotIndex, result);
        }
      }

      errors.push(cleanedProblem);
    } else {
      // Try to extract Pokemon species name from error message
      // Many errors start with the species name (e.g., "Mewtwo is tagged Uber...")
      for (let i = 0; i < team.length; i++) {
        const pokemon = team[i];
        // Check if the error message starts with this Pokemon's species name
        const speciesPattern = new RegExp(`^${pokemon.species}\\b`, 'i');
        if (speciesPattern.test(problem)) {
          const result = pokemonResults.get(i);
          if (result) {
            result.errors.push(problem);
            result.isValid = false;
            pokemonResults.set(i, result);
          }
          break;
        }
      }

      // Add to overall errors
      errors.push(problem);
    }
  });

  return { errors, pokemonResults };
}

/**
 * Validate an entire team using Pokemon Showdown's TeamValidator
 *
 * @param team - Team to validate
 * @param formatId - Showdown format ID (e.g., 'gen9ou', 'gen9doublesou')
 * @returns Validation result with errors for the team and each Pokemon
 *
 * @example
 * const result = validateTeamForFormat(myTeam, 'gen9ou');
 * if (!result.isValid) {
 *   console.log('Team errors:', result.errors);
 * }
 */
export function validateTeamForFormat(
  team: PokemonTeam<'Singles'> | PokemonTeam<'Doubles'>,
  formatId: string
): TeamValidationResult {
  const warnings: string[] = [];

  try {
    const format = Dex.formats.get(formatId);
    if (!format.exists) {
      return {
        isValid: false,
        errors: [`Format '${formatId}' does not exist`],
        warnings: [],
        pokemonResults: new Map(),
      };
    }

    // Convert team to Showdown format
    const pokemonSets: PokemonSet[] = team.pokemon.map(toPokemonSet);

    // Use Showdown's TeamValidator
    const validator = TeamValidator.get(format);
    const problems = validator.validateTeam(pokemonSets);

    // Parse problems and associate with Pokemon slots
    const { errors, pokemonResults } = parseValidationProblems(
      problems || [],
      team.pokemon
    );

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      pokemonResults,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [
        `Validation error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ],
      warnings: [],
      pokemonResults: new Map(),
    };
  }
}

/**
 * Check if a specific species is banned in a format
 * Uses TeamValidator's ruleTable to check bans
 *
 * @param species - Species name to check
 * @param formatId - Showdown format ID
 * @returns true if the species is banned
 *
 * @example
 * isPokemonBanned('Mewtwo', 'gen9vgc2024') // may return true (restricted)
 */
export function isPokemonBanned(species: SpeciesName, formatId: string): boolean {
  try {
    const validator = TeamValidator.get(formatId);
    const speciesData = validator.dex.species.get(species);

    if (!speciesData.exists) return false;

    return validator.ruleTable.isBannedSpecies(speciesData);
  } catch {
    return false;
  }
}

/**
 * Check if a specific move is banned in a format
 *
 * @param moveName - Move name to check
 * @param formatId - Showdown format ID
 * @returns true if the move is banned
 *
 * @example
 * isMoveBanned('Baton Pass', 'gen9ou') // may return true
 */
export function isMoveBanned(moveName: MoveName, formatId: string): boolean {
  try {
    const validator = TeamValidator.get(formatId);
    const move = validator.dex.moves.get(moveName);

    if (!move.exists) return false;

    return validator.ruleTable.isBanned('move:' + move.id);
  } catch {
    return false;
  }
}

/**
 * Check if a specific ability is banned in a format
 *
 * @param abilityName - Ability name to check
 * @param formatId - Showdown format ID
 * @returns true if the ability is banned
 *
 * @example
 * isAbilityBanned('Shadow Tag', 'gen9ou') // may return true
 */
export function isAbilityBanned(abilityName: AbilityName, formatId: string): boolean {
  try {
    const validator = TeamValidator.get(formatId);
    const ability = validator.dex.abilities.get(abilityName);

    if (!ability.exists) return false;

    return validator.ruleTable.isBanned('ability:' + ability.id);
  } catch {
    return false;
  }
}

/**
 * Check if a specific item is banned in a format
 *
 * @param itemName - Item name to check
 * @param formatId - Showdown format ID
 * @returns true if the item is banned
 *
 * @example
 * isItemBanned('Kings Rock', 'gen9vgc2024') // may return true
 */
export function isItemBanned(itemName: ItemName, formatId: string): boolean {
  try {
    const validator = TeamValidator.get(formatId);
    const item = validator.dex.items.get(itemName);

    if (!item.exists) return false;

    return validator.ruleTable.isBanned('item:' + item.id);
  } catch {
    return false;
  }
}
