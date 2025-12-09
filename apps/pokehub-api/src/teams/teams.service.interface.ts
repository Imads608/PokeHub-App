import type {
  CreateTeamDTO,
  UpdateTeamDTO,
  TeamResponseDTO,
} from '@pokehub/shared/pokemon-types';

export const TEAMS_SERVICE = 'TEAMS_SERVICE';

export interface ITeamsService {
  /**
   * Create a new team for a user
   */
  createTeam(userId: string, data: CreateTeamDTO): Promise<TeamResponseDTO>;

  /**
   * Get all teams for a user
   */
  getUserTeams(userId: string): Promise<TeamResponseDTO[]>;

  /**
   * Get a specific team by ID
   * @throws NotFoundException if team not found or doesn't belong to user
   */
  getTeamById(teamId: string, userId: string): Promise<TeamResponseDTO>;

  /**
   * Update a team
   * @throws NotFoundException if team not found or doesn't belong to user
   */
  updateTeam(
    teamId: string,
    userId: string,
    data: UpdateTeamDTO
  ): Promise<TeamResponseDTO>;

  /**
   * Delete a team
   * @throws NotFoundException if team not found or doesn't belong to user
   */
  deleteTeam(teamId: string, userId: string): Promise<void>;
}
