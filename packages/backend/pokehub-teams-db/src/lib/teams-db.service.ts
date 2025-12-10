import type { NewTeam } from './schema/team.schema';
import { teams } from './schema/team.schema';
import * as schema from './schema/team.schema';
import {
  TEAMS_DB_SERVICE,
  type ITeamsDBService,
} from './teams-db-service.interface';
import type { Provider } from '@nestjs/common';
import { Inject, Injectable } from '@nestjs/common';
import { POSTGRES_SERVICE } from '@pokehub/backend/pokehub-postgres';
import { ServiceError } from '@pokehub/backend/shared-exceptions';
import { AppLogger } from '@pokehub/backend/shared-logger';
import { eq, and, count } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
class TeamsDBService implements ITeamsDBService {
  constructor(
    private readonly logger: AppLogger,
    @Inject(POSTGRES_SERVICE)
    private readonly dbService: NodePgDatabase<typeof schema>
  ) {
    this.logger.setContext(TeamsDBService.name);
  }

  async createTeam(data: Omit<NewTeam, 'id' | 'createdAt' | 'updatedAt'>) {
    this.logger.log(`${this.createTeam.name}: Creating team`);
    const team: typeof teams.$inferInsert = {
      ...data,
    };

    const res = await this.dbService.insert(teams).values(team).returning();

    if (res.length === 0) {
      this.logger.error(`${this.createTeam.name}: Unable to create team`);
      throw new ServiceError('ServiceError', 'Unable to create team');
    }

    this.logger.log(`${this.createTeam.name}: Team created successfully`);
    return res[0];
  }

  async getTeam(id: string) {
    this.logger.log(`${this.getTeam.name}: Fetching team by ID: ${id}`);
    const res = await this.dbService
      .select()
      .from(teams)
      .where(eq(teams.id, id))
      .execute();

    if (res.length === 0) {
      this.logger.log(`${this.getTeam.name}: No team found with ID: ${id}`);
      return undefined;
    }

    this.logger.log(`${this.getTeam.name}: Team found with ID: ${id}`);
    return res[0];
  }

  async getTeamsByUserId(userId: string) {
    this.logger.log(
      `${this.getTeamsByUserId.name}: Fetching teams for user: ${userId}`
    );
    const res = await this.dbService
      .select()
      .from(teams)
      .where(eq(teams.userId, userId))
      .execute();

    this.logger.log(
      `${this.getTeamsByUserId.name}: Found ${res.length} teams for user: ${userId}`
    );
    return res;
  }

  async getTeamCountByUserId(userId: string) {
    this.logger.log(
      `${this.getTeamCountByUserId.name}: Counting teams for user: ${userId}`
    );
    const res = await this.dbService
      .select({ count: count() })
      .from(teams)
      .where(eq(teams.userId, userId))
      .execute();

    const teamCount = res[0]?.count ?? 0;
    this.logger.log(
      `${this.getTeamCountByUserId.name}: User ${userId} has ${teamCount} teams`
    );
    return teamCount;
  }

  async updateTeam(
    id: string,
    data: Partial<Omit<NewTeam, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ) {
    this.logger.log(`${this.updateTeam.name}: Updating team ID: ${id}`);
    const res = await this.dbService
      .update(teams)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(teams.id, id))
      .returning();

    if (res.length === 0) {
      this.logger.error(`${this.updateTeam.name}: Unable to update team`);
      throw new ServiceError('ServiceError', 'Unable to update team');
    }

    this.logger.log(`${this.updateTeam.name}: Team updated successfully`);
    return res[0];
  }

  async deleteTeam(id: string, userId: string) {
    this.logger.log(
      `${this.deleteTeam.name}: Deleting team ID: ${id} for user: ${userId}`
    );
    const res = await this.dbService
      .delete(teams)
      .where(and(eq(teams.id, id), eq(teams.userId, userId)))
      .returning();

    if (res.length === 0) {
      this.logger.error(
        `${this.deleteTeam.name}: Unable to delete team or unauthorized`
      );
      return false;
    }

    this.logger.log(`${this.deleteTeam.name}: Team deleted successfully`);
    return true;
  }
}

export const TeamsDBProvider: Provider = {
  provide: TEAMS_DB_SERVICE,
  useClass: TeamsDBService,
};
