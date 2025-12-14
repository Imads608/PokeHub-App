import { Test, TestingModule } from '@nestjs/testing';
import { TeamsDBProvider } from './teams-db.service';
import {
  TEAMS_DB_SERVICE,
  type ITeamsDBService,
} from './teams-db-service.interface';
import type { Team } from './schema/team.schema';
import { POSTGRES_SERVICE } from '@pokehub/backend/pokehub-postgres';
import { ServiceError } from '@pokehub/backend/shared-exceptions';
import { AppLogger } from '@pokehub/backend/shared-logger';
import type { PokemonInTeam } from '@pokehub/shared/pokemon-types';

describe('TeamsDBService', () => {
  let service: ITeamsDBService;

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    setContext: jest.fn(),
  };

  // Mock results that will be set per test
  let selectExecuteResult: unknown[];
  let insertReturningResult: unknown[];
  let updateReturningResult: unknown[];
  let deleteReturningResult: unknown[];

  // Create a mock that properly chains all Drizzle operations
  const createMockDb = () => {
    // Select chain: select() -> from() -> where() -> execute()
    const selectChain = {
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockImplementation(() => Promise.resolve(selectExecuteResult)),
    };

    // Insert chain: insert() -> values() -> returning()
    const insertChain = {
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockImplementation(() => Promise.resolve(insertReturningResult)),
    };

    // Update chain: update() -> set() -> where() -> returning()
    const updateChain = {
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      returning: jest.fn().mockImplementation(() => Promise.resolve(updateReturningResult)),
    };

    // Delete chain: delete() -> where() -> returning()
    const deleteChain = {
      where: jest.fn().mockReturnThis(),
      returning: jest.fn().mockImplementation(() => Promise.resolve(deleteReturningResult)),
    };

    return {
      select: jest.fn().mockReturnValue(selectChain),
      insert: jest.fn().mockReturnValue(insertChain),
      update: jest.fn().mockReturnValue(updateChain),
      delete: jest.fn().mockReturnValue(deleteChain),
      // Expose chains for assertions
      _selectChain: selectChain,
      _insertChain: insertChain,
      _updateChain: updateChain,
      _deleteChain: deleteChain,
    };
  };

  let mockDb: ReturnType<typeof createMockDb>;

  const testUserId = 'user-123';
  const testTeamId = 'team-abc';

  const createMockPokemon = (
    overrides?: Partial<PokemonInTeam>
  ): PokemonInTeam => ({
    species: 'Pikachu' as PokemonInTeam['species'],
    name: '',
    ability: 'Static' as PokemonInTeam['ability'],
    item: 'Light Ball' as PokemonInTeam['item'],
    nature: 'Jolly' as PokemonInTeam['nature'],
    gender: 'M',
    level: 50,
    moves: [
      'Thunderbolt',
      'Volt Tackle',
      'Iron Tail',
      'Quick Attack',
    ] as PokemonInTeam['moves'],
    evs: { hp: 0, atk: 252, def: 0, spa: 0, spd: 4, spe: 252 },
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    ...overrides,
  });

  const createMockTeam = (overrides?: Partial<Team>): Team => ({
    id: testTeamId,
    userId: testUserId,
    name: 'Test Team',
    generation: 9,
    format: 'ou',
    pokemon: [createMockPokemon()],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  });

  beforeEach(async () => {
    // Reset mock results
    selectExecuteResult = [];
    insertReturningResult = [];
    updateReturningResult = [];
    deleteReturningResult = [];

    mockDb = createMockDb();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsDBProvider,
        {
          provide: POSTGRES_SERVICE,
          useValue: mockDb,
        },
        {
          provide: AppLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<ITeamsDBService>(TEAMS_DB_SERVICE);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTeam', () => {
    const createTeamData = {
      userId: testUserId,
      name: 'New Team',
      generation: 9,
      format: 'ou',
      pokemon: [createMockPokemon()],
    };

    it('should insert team and return created entity', async () => {
      const expectedTeam = createMockTeam({ name: 'New Team' });
      insertReturningResult = [expectedTeam];

      const result = await service.createTeam(createTeamData);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(result).toEqual(expectedTeam);
    });

    it('should throw ServiceError when insert fails (empty result)', async () => {
      insertReturningResult = [];

      await expect(service.createTeam(createTeamData)).rejects.toThrow(
        ServiceError
      );
      await expect(service.createTeam(createTeamData)).rejects.toThrow(
        'Unable to create team'
      );
    });

    it('should pass team data to insert query', async () => {
      const expectedTeam = createMockTeam({ name: 'New Team' });
      insertReturningResult = [expectedTeam];

      await service.createTeam(createTeamData);

      expect(mockDb._insertChain.values).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: createTeamData.userId,
          name: createTeamData.name,
          generation: createTeamData.generation,
          format: createTeamData.format,
          pokemon: createTeamData.pokemon,
        })
      );
    });
  });

  describe('getTeam', () => {
    it('should return team when found', async () => {
      const expectedTeam = createMockTeam();
      selectExecuteResult = [expectedTeam];

      const result = await service.getTeam(testTeamId);

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(expectedTeam);
    });

    it('should return undefined when team not found', async () => {
      selectExecuteResult = [];

      const result = await service.getTeam('non-existent-id');

      expect(result).toBeUndefined();
    });
  });

  describe('getTeamsByUserId', () => {
    it('should return all teams for user', async () => {
      const teams = [
        createMockTeam({ id: 'team-1', name: 'Team 1' }),
        createMockTeam({ id: 'team-2', name: 'Team 2' }),
      ];
      selectExecuteResult = teams;

      const result = await service.getTeamsByUserId(testUserId);

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result).toEqual(teams);
    });

    it('should return empty array when user has no teams', async () => {
      selectExecuteResult = [];

      const result = await service.getTeamsByUserId(testUserId);

      expect(result).toEqual([]);
    });
  });

  describe('getTeamCountByUserId', () => {
    it('should return correct count', async () => {
      selectExecuteResult = [{ count: 3 }];

      const result = await service.getTeamCountByUserId(testUserId);

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toBe(3);
    });

    it('should return 0 when user has no teams', async () => {
      selectExecuteResult = [{ count: 0 }];

      const result = await service.getTeamCountByUserId(testUserId);

      expect(result).toBe(0);
    });

    it('should return 0 when result is empty', async () => {
      selectExecuteResult = [];

      const result = await service.getTeamCountByUserId(testUserId);

      expect(result).toBe(0);
    });
  });

  describe('updateTeam', () => {
    const updateData = {
      name: 'Updated Team Name',
      generation: 8,
      format: 'vgc2024',
      pokemon: [
        createMockPokemon({ species: 'Charizard' as PokemonInTeam['species'] }),
      ],
    };

    it('should update team and return updated entity', async () => {
      const updatedTeam = createMockTeam({
        name: updateData.name,
        updatedAt: new Date(),
      });
      updateReturningResult = [updatedTeam];

      const result = await service.updateTeam(testTeamId, updateData);

      expect(mockDb.update).toHaveBeenCalled();
      expect(result).toEqual(updatedTeam);
    });

    it('should throw ServiceError when update fails', async () => {
      updateReturningResult = [];

      await expect(
        service.updateTeam('non-existent-id', updateData)
      ).rejects.toThrow(ServiceError);
      await expect(
        service.updateTeam('non-existent-id', updateData)
      ).rejects.toThrow('Unable to update team');
    });

    it('should include updatedAt timestamp in update', async () => {
      const updatedTeam = createMockTeam({ name: updateData.name });
      updateReturningResult = [updatedTeam];

      await service.updateTeam(testTeamId, updateData);

      expect(mockDb._updateChain.set).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updateData,
          updatedAt: expect.any(Date),
        })
      );
    });
  });

  describe('deleteTeam', () => {
    it('should return true when deletion succeeds', async () => {
      const deletedTeam = createMockTeam();
      deleteReturningResult = [deletedTeam];

      const result = await service.deleteTeam(testTeamId, testUserId);

      expect(mockDb.delete).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when team not found or unauthorized', async () => {
      deleteReturningResult = [];

      const result = await service.deleteTeam('non-existent-id', testUserId);

      expect(result).toBe(false);
    });

    it('should use where clause for deletion', async () => {
      const deletedTeam = createMockTeam();
      deleteReturningResult = [deletedTeam];

      await service.deleteTeam(testTeamId, testUserId);

      expect(mockDb._deleteChain.where).toHaveBeenCalled();
    });
  });
});
