import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ShowdownTeamValidationPipe } from './pipes/showdown-team-validation.pipe';
import { ITeamsService, TEAMS_SERVICE } from './teams.service.interface';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  TokenAuth,
  TokenAuthGuard,
  User,
  type UserJwtData,
} from '@pokehub/backend/shared-auth-utils';
import { AppLogger } from '@pokehub/backend/shared-logger';
import {
  CreateTeamDTOSchema,
  UpdateTeamDTOSchema,
  type CreateTeamDTO,
  type UpdateTeamDTO,
  type TeamResponseDTO,
} from '@pokehub/shared/pokemon-types';

@Controller()
export class TeamsController {
  constructor(
    private readonly logger: AppLogger,
    @Inject(TEAMS_SERVICE) private readonly teamsService: ITeamsService
  ) {
    this.logger.setContext(TeamsController.name);
  }

  @Post()
  @UseGuards(TokenAuthGuard)
  @TokenAuth('ACCESS_TOKEN')
  async createTeam(
    @User() user: UserJwtData,
    @Body(new ZodValidationPipe(CreateTeamDTOSchema), ShowdownTeamValidationPipe)
    data: CreateTeamDTO
  ): Promise<TeamResponseDTO> {
    this.logger.log(`createTeam: Creating team for user ${user.id}`);
    return this.teamsService.createTeam(user.id, data);
  }

  @Get()
  @UseGuards(TokenAuthGuard)
  @TokenAuth('ACCESS_TOKEN')
  async getUserTeams(@User() user: UserJwtData): Promise<TeamResponseDTO[]> {
    this.logger.log(`getUserTeams: Fetching teams for user ${user.id}`);
    return this.teamsService.getUserTeams(user.id);
  }

  @Get(':id')
  @UseGuards(TokenAuthGuard)
  @TokenAuth('ACCESS_TOKEN')
  async getTeamById(
    @User() user: UserJwtData,
    @Param('id') teamId: string
  ): Promise<TeamResponseDTO> {
    this.logger.log(`getTeamById: Fetching team ${teamId} for user ${user.id}`);
    return this.teamsService.getTeamById(teamId, user.id);
  }

  @Put(':id')
  @UseGuards(TokenAuthGuard)
  @TokenAuth('ACCESS_TOKEN')
  async updateTeam(
    @User() user: UserJwtData,
    @Param('id') teamId: string,
    @Body(new ZodValidationPipe(UpdateTeamDTOSchema), ShowdownTeamValidationPipe)
    data: UpdateTeamDTO
  ): Promise<TeamResponseDTO> {
    this.logger.log(`updateTeam: Updating team ${teamId} for user ${user.id}`);
    return this.teamsService.updateTeam(teamId, user.id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(TokenAuthGuard)
  @TokenAuth('ACCESS_TOKEN')
  async deleteTeam(
    @User() user: UserJwtData,
    @Param('id') teamId: string
  ): Promise<void> {
    this.logger.log(`deleteTeam: Deleting team ${teamId} for user ${user.id}`);
    return this.teamsService.deleteTeam(teamId, user.id);
  }
}
