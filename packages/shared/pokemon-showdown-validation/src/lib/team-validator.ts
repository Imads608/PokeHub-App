/**** NOT USED AT THE MOMENT ****/
import type { SpeciesName, MoveName, AbilityName, ItemName } from '@pkmn/dex';
import { Dex } from '@pkmn/sim';
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
 * Validate a single Pokemon for format-specific bans
 * Does NOT validate tier placement (handled by UI filtering)
 *
 * @param pokemon - Pokemon to validate
 * @param formatId - Showdown format ID (e.g., 'gen9ou', 'gen9doublesou')
 * @returns Validation result with errors and warnings
 *
 * @example
 * const result = validatePokemonForFormat(myPokemon, 'gen9ou');
 * if (!result.isValid) {
 *   console.log('Errors:', result.errors);
 * }
 */
export function validatePokemonForFormat(
  pokemon: PokemonInTeam,
  formatId: string
): PokemonValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const format = Dex.formats.get(formatId);
    if (!format.exists) {
      errors.push(`Format '${formatId}' does not exist`);
      return { isValid: false, errors, warnings };
    }

    const validator = Dex.formats.getRuleTable(format);
    const dex = Dex.forFormat(format);

    // Validate species exists in this generation
    const species = dex.species.get(pokemon.species);
    if (!species.exists) {
      errors.push(`${pokemon.species} does not exist in this generation`);
      return { isValid: false, errors, warnings };
    }

    // Check if species is explicitly banned (not tier-related)
    // This catches things like restricted legendaries in VGC
    if (validator.isBannedSpecies(species)) {
      errors.push(`${species.name} is banned in ${format.name}`);
    }

    // Validate ability
    if (pokemon.ability) {
      const ability = dex.abilities.get(pokemon.ability);
      if (!ability.exists) {
        errors.push(`${pokemon.ability} does not exist in this generation`);
      } else if (validator.isBanned('ability:' + ability.id)) {
        errors.push(`${ability.name} is banned in ${format.name}`);
      }
    }

    // Validate item
    if (pokemon.item) {
      const item = dex.items.get(pokemon.item);
      if (!item.exists) {
        errors.push(`${pokemon.item} does not exist in this generation`);
      } else if (validator.isBanned('item:' + item.id)) {
        errors.push(`${item.name} is banned in ${format.name}`);
      }
    }

    // Validate moves
    if (pokemon.moves && pokemon.moves.length > 0) {
      for (const moveName of pokemon.moves) {
        if (!moveName) continue;

        const move = dex.moves.get(moveName);
        if (!move.exists) {
          errors.push(`${moveName} does not exist in this generation`);
        } else if (validator.isBanned('move:' + move.id)) {
          errors.push(`${move.name} is banned in ${format.name}`);
        }
      }
    }
  } catch (error) {
    errors.push(
      `Validation error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate an entire team for format-specific rules
 * Checks format bans and clauses, but NOT tier placement
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
  const errors: string[] = [];
  const warnings: string[] = [];
  const pokemonResults = new Map<number, PokemonValidationResult>();

  try {
    const format = Dex.formats.get(formatId);
    if (!format.exists) {
      errors.push(`Format '${formatId}' does not exist`);
      return { isValid: false, errors, warnings, pokemonResults };
    }

    // Validate team size (basic check)
    if (team.pokemon.length === 0) {
      errors.push('Team must have at least one Pokemon');
    }

    if (team.pokemon.length > 6) {
      errors.push('Team cannot have more than 6 Pokemon');
    }

    // Validate each Pokemon for format-specific bans
    team.pokemon.forEach((pokemon, index) => {
      const result = validatePokemonForFormat(pokemon, formatId);
      pokemonResults.set(index, result);

      if (!result.isValid) {
        errors.push(
          ...result.errors.map(
            (err) => `Pokemon ${index + 1} (${pokemon.species}): ${err}`
          )
        );
      }
    });

    // Check format clauses
    // Species Clause: No duplicate Pokemon (enabled in almost all competitive formats)
    const speciesCount = new Map<string, number[]>();
    team.pokemon.forEach((pokemon, index) => {
      const speciesId = pokemon.species.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!speciesCount.has(speciesId)) {
        speciesCount.set(speciesId, []);
      }
      speciesCount.get(speciesId)!.push(index + 1);
    });

    speciesCount.forEach((indices, species) => {
      if (indices.length > 1) {
        errors.push(
          `Species Clause: Duplicate ${species} in slots ${indices.join(', ')}`
        );
      }
    });

    // Item Clause: Check for duplicate items if format enforces it
    // Many competitive formats have item clause
    const itemCount = new Map<string, number[]>();
    team.pokemon.forEach((pokemon, index) => {
      if (pokemon.item && pokemon.item !== '') {
        const itemId = pokemon.item.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!itemCount.has(itemId)) {
          itemCount.set(itemId, []);
        }
        itemCount.get(itemId)!.push(index + 1);
      }
    });

    itemCount.forEach((indices, item) => {
      if (indices.length > 1) {
        // Check if format has item clause
        // Most Smogon formats don't have item clause, but VGC does
        if (formatId.includes('vgc') || formatId.includes('battlestadium')) {
          errors.push(
            `Item Clause: Duplicate ${item} in slots ${indices.join(', ')}`
          );
        } else {
          // For non-VGC formats, it's just a warning
          warnings.push(
            `Duplicate ${item} in slots ${indices.join(
              ', '
            )} (legal in this format)`
          );
        }
      }
    });
  } catch (error) {
    errors.push(
      `Team validation error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    pokemonResults,
  };
}

/**
 * Check if a specific species is explicitly banned in a format
 * Does NOT check tier placement (e.g., OU in UU) - that's handled by UI filtering
 * Only checks explicit bans (e.g., restricted legendaries in VGC)
 *
 * @param species - Species name to check
 * @param formatId - Showdown format ID
 * @returns true if the species is explicitly banned
 *
 * @example
 * isPokemonBanned('Mewtwo', 'gen9vgc2024') // likely returns true (restricted)
 * isPokemonBanned('Landorus-Therian', 'gen9ou') // returns false (tier placement, not a ban)
 */
export function isPokemonBanned(
  species: SpeciesName,
  formatId: string
): boolean {
  try {
    const format = Dex.formats.get(formatId);
    if (!format.exists) return false;

    const validator = Dex.formats.getRuleTable(format);
    const dex = Dex.forFormat(format);
    const speciesData = dex.species.get(species);

    if (!speciesData.exists) return false;

    return validator.isBannedSpecies(speciesData);
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
 * isMoveBanned('Thunder', 'gen9ou') // returns false
 */
export function isMoveBanned(moveName: MoveName, formatId: string): boolean {
  try {
    const format = Dex.formats.get(formatId);
    if (!format.exists) return false;

    const validator = Dex.formats.getRuleTable(format);
    const dex = Dex.forFormat(format);
    const move = dex.moves.get(moveName);

    if (!move.exists) return false;

    return validator.isBanned('move:' + move.id);
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
 * isAbilityBanned('Intimidate', 'gen9ou') // returns false
 */
export function isAbilityBanned(
  abilityName: AbilityName,
  formatId: string
): boolean {
  try {
    const format = Dex.formats.get(formatId);
    if (!format.exists) return false;

    const validator = Dex.formats.getRuleTable(format);
    const dex = Dex.forFormat(format);
    const ability = dex.abilities.get(abilityName);

    if (!ability.exists) return false;

    return validator.isBanned('ability:' + ability.id);
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
 * isItemBanned('Kings Rock', 'gen9vgc2024') // likely returns true
 * isItemBanned('Choice Scarf', 'gen9ou') // returns false
 */
export function isItemBanned(itemName: ItemName, formatId: string): boolean {
  try {
    const format = Dex.formats.get(formatId);
    if (!format.exists) return false;

    const validator = Dex.formats.getRuleTable(format);
    const dex = Dex.forFormat(format);
    const item = dex.items.get(itemName);

    if (!item.exists) return false;

    return validator.isBanned('item:' + item.id);
  } catch {
    return false;
  }
}
