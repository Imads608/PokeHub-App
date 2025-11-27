import { z } from 'zod';

/**
 * Validation schema for Pokemon in a team
 */
export const pokemonInTeamSchema = z.object({
  species: z.string().min(1, 'Species is required'),
  ability: z.string().min(1, 'Ability is required'),
  item: z.string(), // Optional
  nature: z.string().min(1, 'Nature is required'),
  gender: z.enum(['M', 'F', 'N']),
  level: z.number().min(1, 'Level must be at least 1').max(100, 'Level cannot exceed 100'),
  name: z.string(), // Nickname - optional
  moves: z
    .array(z.string())
    .min(1, 'Pokemon must have at least one move')
    .max(4, 'Pokemon cannot have more than 4 moves')
    .refine(
      (moves) => moves.filter((m) => m !== '').length >= 1,
      'Pokemon must have at least one move'
    ),
  evs: z
    .object({
      hp: z.number().min(0).max(252),
      atk: z.number().min(0).max(252),
      def: z.number().min(0).max(252),
      spa: z.number().min(0).max(252),
      spd: z.number().min(0).max(252),
      spe: z.number().min(0).max(252),
    })
    .refine(
      (evs) => {
        const total = Object.values(evs).reduce((sum, ev) => sum + ev, 0);
        return total <= 510;
      },
      { message: 'Total EVs cannot exceed 510' }
    ),
  ivs: z.object({
    hp: z.number().min(0, 'IV must be at least 0').max(31, 'IV cannot exceed 31'),
    atk: z.number().min(0, 'IV must be at least 0').max(31, 'IV cannot exceed 31'),
    def: z.number().min(0, 'IV must be at least 0').max(31, 'IV cannot exceed 31'),
    spa: z.number().min(0, 'IV must be at least 0').max(31, 'IV cannot exceed 31'),
    spd: z.number().min(0, 'IV must be at least 0').max(31, 'IV cannot exceed 31'),
    spe: z.number().min(0, 'IV must be at least 0').max(31, 'IV cannot exceed 31'),
  }),
});

/**
 * Validation schema for a Pokemon team
 */
export const pokemonTeamSchema = z.object({
  name: z
    .string()
    .min(1, 'Team name is required')
    .max(50, 'Team name cannot exceed 50 characters'),
  generation: z.number(),
  format: z.string().min(1, 'Format is required'),
  pokemon: z
    .array(pokemonInTeamSchema)
    .min(1, 'Team must have at least one Pokemon')
    .max(6, 'Team cannot have more than 6 Pokemon'),
});

/**
 * Validation error type
 */
export interface ValidationError {
  field: string;
  message: string;
  pokemonSlot?: number; // 0-5 for team slots
}

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validate a single Pokemon
 */
export const validatePokemon = (
  pokemon: unknown,
  slotIndex?: number
): ValidationResult => {
  const result = pokemonInTeamSchema.safeParse(pokemon);

  if (result.success) {
    return { isValid: true, errors: [] };
  }

  const errors: ValidationError[] = result.error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    pokemonSlot: slotIndex,
  }));

  return { isValid: false, errors };
};

/**
 * Validate a Pokemon team
 * Filters out undefined Pokemon slots before validation
 */
export const validateTeam = (team: {
  name?: string;
  generation: number;
  format: string;
  pokemon: (unknown | undefined)[];
}): ValidationResult => {
  // Create a mapping of filtered index to original slot position
  const slotMapping: number[] = [];
  const definedPokemon = team.pokemon.filter((p, originalIndex) => {
    if (p !== undefined) {
      slotMapping.push(originalIndex);
      return true;
    }
    return false;
  });

  // Check if team has at least one Pokemon
  if (definedPokemon.length === 0) {
    return {
      isValid: false,
      errors: [
        {
          field: 'pokemon',
          message: 'Team must have at least one Pokemon',
        },
      ],
    };
  }

  // Validate team with defined Pokemon only
  const teamToValidate = {
    ...team,
    name: team.name || '',
    pokemon: definedPokemon,
  };

  const result = pokemonTeamSchema.safeParse(teamToValidate);

  if (result.success) {
    return { isValid: true, errors: [] };
  }

  const errors: ValidationError[] = result.error.errors.map((err) => {
    // Extract Pokemon slot index from path if it exists
    const path = err.path;
    let pokemonSlot: number | undefined;

    if (path[0] === 'pokemon' && typeof path[1] === 'number') {
      // Map filtered array index back to original slot position
      pokemonSlot = slotMapping[path[1]];
    }

    return {
      field: path.join('.'),
      message: err.message,
      pokemonSlot,
    };
  });

  return { isValid: false, errors };
};

/**
 * Get validation errors for a specific Pokemon slot
 */
export const getPokemonSlotErrors = (
  validationResult: ValidationResult,
  slotIndex: number
): ValidationError[] => {
  return validationResult.errors.filter(
    (err) => err.pokemonSlot === slotIndex
  );
};

/**
 * Get team-level validation errors (not specific to any Pokemon)
 */
export const getTeamLevelErrors = (
  validationResult: ValidationResult
): ValidationError[] => {
  return validationResult.errors.filter((err) => err.pokemonSlot === undefined);
};

/**
 * Check if a Pokemon has at least one move
 */
export const hasAtLeastOneMove = (moves: (string | '')[]): boolean => {
  return moves.filter((m) => m !== '').length >= 1;
};

/**
 * Get user-friendly error message for a field
 */
export const getFieldErrorMessage = (
  errors: ValidationError[],
  field: string
): string | undefined => {
  const error = errors.find((err) => err.field === field || err.field.endsWith(`.${field}`));
  return error?.message;
};
