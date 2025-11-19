// Team types
export type { BattleFormat, PokemonInTeam, PokemonTeam } from './lib/team.types';

// DTOs
export {
  PokemonInTeamSchema,
  CreateTeamDTOSchema,
  type CreateTeamDTO
} from './lib/dtos/create-team.dto';

export {
  UpdateTeamDTOSchema,
  type UpdateTeamDTO
} from './lib/dtos/update-team.dto';

export {
  TeamResponseDTOSchema,
  type TeamResponseDTO
} from './lib/dtos/team-response.dto';
