export type { PokemonInTeam, PokemonTeam } from './lib/pokemon-team';
export {
  validateTeam,
  validatePokemon,
  hasAtLeastOneMove,
  pokemonTeamSchema,
  getTeamLevelErrors,
  pokemonInTeamSchema,
  getFieldErrorMessage,
  getPokemonSlotErrors,
  type ValidationError,
  type ValidationResult,
} from './lib/pokemon-team.validation';
