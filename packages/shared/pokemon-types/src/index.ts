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

// DTOs for API layer
export {
  CreateTeamDTOSchema,
  type CreateTeamDTO,
} from './lib/dtos/create-team.dto';
export {
  UpdateTeamDTOSchema,
  type UpdateTeamDTO,
} from './lib/dtos/update-team.dto';
export {
  TeamResponseDTOSchema,
  type TeamResponseDTO,
} from './lib/dtos/team-response.dto';
