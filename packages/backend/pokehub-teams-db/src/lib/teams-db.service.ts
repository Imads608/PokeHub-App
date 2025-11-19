import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { POSTGRES_SERVICE } from '@pokehub/backend/pokehub-postgres';
import { eq, and, desc } from 'drizzle-orm';
import { teams, type Team, type NewTeam } from './schema/team.schema';
import * as schema from './schema/team.schema';

@Injectable()
export class TeamsDBService {
  constructor(
    @Inject(POSTGRES_SERVICE)
    private readonly db: NodePgDatabase<typeof schema>
  ) {}

  async createTeam(newTeam: NewTeam): Promise<Team> {
    const [team] = await this.db
      .insert(teams)
      .values({
        ...newTeam,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return team;
  }

  async getTeamById(teamId: string, userId: string): Promise<Team | null> {
    const [team] = await this.db
      .select()
      .from(teams)
      .where(and(eq(teams.id, teamId), eq(teams.userId, userId)));
    return team || null;
  }

  async getUserTeams(userId: string): Promise<Team[]> {
    return await this.db
      .select()
      .from(teams)
      .where(eq(teams.userId, userId))
      .orderBy(desc(teams.createdAt));
  }

  async updateTeam(
    teamId: string,
    userId: string,
    updates: Partial<Omit<Team, 'id' | 'userId' | 'createdAt'>>
  ): Promise<Team | null> {
    const [team] = await this.db
      .update(teams)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(eq(teams.id, teamId), eq(teams.userId, userId)))
      .returning();
    return team || null;
  }

  async deleteTeam(teamId: string, userId: string): Promise<boolean> {
    const result = await this.db
      .delete(teams)
      .where(and(eq(teams.id, teamId), eq(teams.userId, userId)))
      .returning();
    return result.length > 0;
  }
}
