import { ITeamsService } from './teams.service.interface';
import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ITeamsDBService,
  TEAMS_DB_SERVICE,
  Team,
} from '@pokehub/backend/pokehub-teams-db';
import { ServiceError } from '@pokehub/backend/shared-exceptions';
import { AppLogger } from '@pokehub/backend/shared-logger';
import type {
  CreateTeamDTO,
  UpdateTeamDTO,
  TeamResponseDTO,
  PokemonInTeam,
} from '@pokehub/shared/pokemon-types';

@Injectable()
export class TeamsService implements ITeamsService {
  private static readonly MAX_TEAMS_PER_USER = 5;

  constructor(
    private readonly logger: AppLogger,
    @Inject(TEAMS_DB_SERVICE) private readonly teamsDbService: ITeamsDBService
  ) {
    this.logger.setContext(TeamsService.name);
  }

  async createTeam(
    userId: string,
    data: CreateTeamDTO
  ): Promise<TeamResponseDTO> {
    this.logger.log(
      `${this.createTeam.name}: Creating team for user ${userId}`
    );

    const teamCount = await this.teamsDbService.getTeamCountByUserId(userId);
    if (teamCount >= TeamsService.MAX_TEAMS_PER_USER) {
      this.logger.warn(
        `${this.createTeam.name}: User ${userId} has reached the maximum number of teams (${TeamsService.MAX_TEAMS_PER_USER})`
      );
      throw new ServiceError(
        'BadRequest',
        `You have reached the maximum number of teams (${TeamsService.MAX_TEAMS_PER_USER}). Please delete an existing team before creating a new one.`
      );
    }

    const team = await this.teamsDbService.createTeam({
      userId,
      name: data.name,
      generation: data.generation,
      format: data.format,
      pokemon: data.pokemon as PokemonInTeam[],
    });

    this.logger.log(
      `${this.createTeam.name}: Team created successfully with ID ${team.id}`
    );

    return this.toTeamResponseDTO(team);
  }

  async getUserTeams(userId: string): Promise<TeamResponseDTO[]> {
    this.logger.log(
      `${this.getUserTeams.name}: Fetching teams for user ${userId}`
    );

    const teams = await this.teamsDbService.getTeamsByUserId(userId);

    this.logger.log(
      `${this.getUserTeams.name}: Found ${teams.length} teams for user ${userId}`
    );

    return teams.map((team) => this.toTeamResponseDTO(team));
  }

  async getTeamById(teamId: string, userId: string): Promise<TeamResponseDTO> {
    this.logger.log(
      `${this.getTeamById.name}: Fetching team ${teamId} for user ${userId}`
    );

    const team = await this.teamsDbService.getTeam(teamId);

    if (!team) {
      this.logger.warn(`${this.getTeamById.name}: Team ${teamId} not found`);
      throw new NotFoundException('Team not found');
    }

    if (team.userId !== userId) {
      this.logger.warn(
        `${this.getTeamById.name}: User ${userId} attempted to access team ${teamId} owned by ${team.userId}`
      );
      throw new ForbiddenException('You do not have access to this team');
    }

    return this.toTeamResponseDTO(team);
  }

  async updateTeam(
    teamId: string,
    userId: string,
    data: UpdateTeamDTO
  ): Promise<TeamResponseDTO> {
    this.logger.log(
      `${this.updateTeam.name}: Updating team ${teamId} for user ${userId}`
    );

    // Verify ownership first
    const existingTeam = await this.teamsDbService.getTeam(teamId);

    if (!existingTeam) {
      this.logger.warn(`${this.updateTeam.name}: Team ${teamId} not found`);
      throw new NotFoundException('Team not found');
    }

    if (existingTeam.userId !== userId) {
      this.logger.warn(
        `${this.updateTeam.name}: User ${userId} attempted to update team ${teamId} owned by ${existingTeam.userId}`
      );
      throw new ForbiddenException('You do not have access to this team');
    }

    const updatedTeam = await this.teamsDbService.updateTeam(teamId, {
      name: data.name,
      generation: data.generation,
      format: data.format,
      pokemon: data.pokemon as PokemonInTeam[],
    });

    this.logger.log(
      `${this.updateTeam.name}: Team ${teamId} updated successfully`
    );

    return this.toTeamResponseDTO(updatedTeam);
  }

  async deleteTeam(teamId: string, userId: string): Promise<void> {
    this.logger.log(
      `${this.deleteTeam.name}: Deleting team ${teamId} for user ${userId}`
    );

    const deleted = await this.teamsDbService.deleteTeam(teamId, userId);

    if (!deleted) {
      this.logger.warn(
        `${this.deleteTeam.name}: Failed to delete team ${teamId} - not found or unauthorized`
      );
      throw new NotFoundException('Team not found');
    }

    this.logger.log(
      `${this.deleteTeam.name}: Team ${teamId} deleted successfully`
    );
  }

  private toTeamResponseDTO(team: Team): TeamResponseDTO {
    return {
      id: team.id,
      userId: team.userId,
      name: team.name,
      generation: team.generation,
      format: team.format,
      pokemon: team.pokemon,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    };
  }
}
