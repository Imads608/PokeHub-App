import type { Team, NewTeam } from './schema/team.schema';

export const TEAMS_DB_SERVICE = 'TEAMS_DB_SERVICE';

export interface ITeamsDBService {
  createTeam(data: Omit<NewTeam, 'id' | 'createdAt' | 'updatedAt'>): Promise<Team>;

  getTeam(id: string): Promise<Team | undefined>;

  getTeamsByUserId(userId: string): Promise<Team[]>;

  getTeamCountByUserId(userId: string): Promise<number>;

  updateTeam(
    id: string,
    data: Partial<Omit<NewTeam, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<Team>;

  deleteTeam(id: string, userId: string): Promise<boolean>;
}

