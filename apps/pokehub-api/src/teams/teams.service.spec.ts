import { TeamsService } from './teams.service';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  TEAMS_DB_SERVICE,
  type ITeamsDBService,
  type Team,
} from '@pokehub/backend/pokehub-teams-db';
import { ServiceError } from '@pokehub/backend/shared-exceptions';
import { AppLogger } from '@pokehub/backend/shared-logger';
import type {
  CreateTeamDTO,
  UpdateTeamDTO,
  PokemonInTeam,
} from '@pokehub/shared/pokemon-types';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('TeamsService', () => {
  let service: TeamsService;

  const mockDbService: jest.Mocked<ITeamsDBService> = {
    createTeam: jest.fn(),
    getTeam: jest.fn(),
    getTeamsByUserId: jest.fn(),
    getTeamCountByUserId: jest.fn(),
    updateTeam: jest.fn(),
    deleteTeam: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    setContext: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const testUserId = 'user-123';
  const otherUserId = 'user-456';
  const testTeamId = 'team-abc';
  const defaultMaxTeams = 5;

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

  const createMockCreateTeamDTO = (
    overrides?: Partial<CreateTeamDTO>
  ): CreateTeamDTO => ({
    name: 'Test Team',
    generation: 9,
    format: 'ou',
    pokemon: [createMockPokemon()],
    ...overrides,
  });

  const createService = async (maxTeamsPerUser = defaultMaxTeams) => {
    mockConfigService.get.mockReturnValue({ maxTeamsPerUser });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        {
          provide: TEAMS_DB_SERVICE,
          useValue: mockDbService,
        },
        {
          provide: AppLogger,
          useValue: mockLogger,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    return module.get<TeamsService>(TeamsService);
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    service = await createService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('configuration', () => {
    it('should use maxTeamsPerUser from config', async () => {
      const customMaxTeams = 10;
      const customService = await createService(customMaxTeams);

      mockDbService.getTeamCountByUserId.mockResolvedValue(customMaxTeams - 1);
      mockDbService.createTeam.mockResolvedValue(createMockTeam());

      await customService.createTeam(testUserId, createMockCreateTeamDTO());

      expect(mockDbService.createTeam).toHaveBeenCalled();
    });

    it('should default to 5 when config returns undefined', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          TeamsService,
          { provide: TEAMS_DB_SERVICE, useValue: mockDbService },
          { provide: AppLogger, useValue: mockLogger },
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      const defaultService = module.get<TeamsService>(TeamsService);

      mockDbService.getTeamCountByUserId.mockResolvedValue(5);

      await expect(
        defaultService.createTeam(testUserId, createMockCreateTeamDTO())
      ).rejects.toThrow(ServiceError);
    });
  });

  describe('createTeam', () => {
    it('should create team successfully when under limit', async () => {
      const createDTO = createMockCreateTeamDTO();
      const expectedTeam = createMockTeam();

      mockDbService.getTeamCountByUserId.mockResolvedValue(0);
      mockDbService.createTeam.mockResolvedValue(expectedTeam);

      const result = await service.createTeam(testUserId, createDTO);

      expect(mockDbService.getTeamCountByUserId).toHaveBeenCalledWith(
        testUserId
      );
      expect(mockDbService.createTeam).toHaveBeenCalledWith({
        userId: testUserId,
        name: createDTO.name,
        generation: createDTO.generation,
        format: createDTO.format,
        pokemon: createDTO.pokemon,
      });
      expect(result).toEqual({
        id: expectedTeam.id,
        userId: expectedTeam.userId,
        name: expectedTeam.name,
        generation: expectedTeam.generation,
        format: expectedTeam.format,
        pokemon: expectedTeam.pokemon,
        createdAt: expectedTeam.createdAt,
        updatedAt: expectedTeam.updatedAt,
      });
    });

    it('should create team when user has maxTeams - 1 teams (under limit)', async () => {
      const createDTO = createMockCreateTeamDTO();
      const expectedTeam = createMockTeam();

      mockDbService.getTeamCountByUserId.mockResolvedValue(
        defaultMaxTeams - 1
      );
      mockDbService.createTeam.mockResolvedValue(expectedTeam);

      const result = await service.createTeam(testUserId, createDTO);

      expect(mockDbService.createTeam).toHaveBeenCalled();
      expect(result.id).toBe(expectedTeam.id);
    });

    it('should throw ServiceError when user has reached maxTeamsPerUser', async () => {
      const createDTO = createMockCreateTeamDTO();

      mockDbService.getTeamCountByUserId.mockResolvedValue(defaultMaxTeams);

      await expect(service.createTeam(testUserId, createDTO)).rejects.toThrow(
        ServiceError
      );
      await expect(service.createTeam(testUserId, createDTO)).rejects.toThrow(
        `You have reached the maximum number of teams (${defaultMaxTeams})`
      );

      expect(mockDbService.createTeam).not.toHaveBeenCalled();
    });

    it('should throw ServiceError when user exceeds maxTeamsPerUser', async () => {
      const createDTO = createMockCreateTeamDTO();

      mockDbService.getTeamCountByUserId.mockResolvedValue(
        defaultMaxTeams + 5
      );

      await expect(service.createTeam(testUserId, createDTO)).rejects.toThrow(
        ServiceError
      );

      expect(mockDbService.createTeam).not.toHaveBeenCalled();
    });

    it('should respect custom maxTeamsPerUser configuration', async () => {
      const customMaxTeams = 3;
      const customService = await createService(customMaxTeams);
      const createDTO = createMockCreateTeamDTO();

      mockDbService.getTeamCountByUserId.mockResolvedValue(customMaxTeams);

      await expect(
        customService.createTeam(testUserId, createDTO)
      ).rejects.toThrow(
        `You have reached the maximum number of teams (${customMaxTeams})`
      );
    });

    it('should check team count before creating', async () => {
      const createDTO = createMockCreateTeamDTO();
      const expectedTeam = createMockTeam();

      mockDbService.getTeamCountByUserId.mockResolvedValue(0);
      mockDbService.createTeam.mockResolvedValue(expectedTeam);

      await service.createTeam(testUserId, createDTO);

      const countCallOrder =
        mockDbService.getTeamCountByUserId.mock.invocationCallOrder[0];
      const createCallOrder =
        mockDbService.createTeam.mock.invocationCallOrder[0];

      expect(countCallOrder).toBeLessThan(createCallOrder);
    });

    it('should return TeamResponseDTO with all fields mapped correctly', async () => {
      const createDTO = createMockCreateTeamDTO();
      const dbTeam = createMockTeam({
        id: 'unique-id-123',
        name: 'My Competitive Team',
        generation: 8,
        format: 'vgc2024',
      });

      mockDbService.getTeamCountByUserId.mockResolvedValue(0);
      mockDbService.createTeam.mockResolvedValue(dbTeam);

      const result = await service.createTeam(testUserId, createDTO);

      expect(result).toHaveProperty('id', dbTeam.id);
      expect(result).toHaveProperty('userId', dbTeam.userId);
      expect(result).toHaveProperty('name', dbTeam.name);
      expect(result).toHaveProperty('generation', dbTeam.generation);
      expect(result).toHaveProperty('format', dbTeam.format);
      expect(result).toHaveProperty('pokemon', dbTeam.pokemon);
      expect(result).toHaveProperty('createdAt', dbTeam.createdAt);
      expect(result).toHaveProperty('updatedAt', dbTeam.updatedAt);
    });
  });

  describe('getUserTeams', () => {
    it('should return empty array when user has no teams', async () => {
      mockDbService.getTeamsByUserId.mockResolvedValue([]);

      const result = await service.getUserTeams(testUserId);

      expect(mockDbService.getTeamsByUserId).toHaveBeenCalledWith(testUserId);
      expect(result).toEqual([]);
    });

    it('should return all teams for user', async () => {
      const teams = [
        createMockTeam({ id: 'team-1', name: 'Team 1' }),
        createMockTeam({ id: 'team-2', name: 'Team 2' }),
        createMockTeam({ id: 'team-3', name: 'Team 3' }),
      ];

      mockDbService.getTeamsByUserId.mockResolvedValue(teams);

      const result = await service.getUserTeams(testUserId);

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Team 1');
      expect(result[1].name).toBe('Team 2');
      expect(result[2].name).toBe('Team 3');
    });

    it('should map Team entities to TeamResponseDTOs correctly', async () => {
      const team = createMockTeam();
      mockDbService.getTeamsByUserId.mockResolvedValue([team]);

      const result = await service.getUserTeams(testUserId);

      expect(result[0]).toEqual({
        id: team.id,
        userId: team.userId,
        name: team.name,
        generation: team.generation,
        format: team.format,
        pokemon: team.pokemon,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      });
    });
  });

  describe('getTeamById', () => {
    it('should return team when user owns it', async () => {
      const team = createMockTeam();
      mockDbService.getTeam.mockResolvedValue(team);

      const result = await service.getTeamById(testTeamId, testUserId);

      expect(mockDbService.getTeam).toHaveBeenCalledWith(testTeamId);
      expect(result.id).toBe(team.id);
      expect(result.name).toBe(team.name);
    });

    it('should throw NotFoundException when team does not exist', async () => {
      mockDbService.getTeam.mockResolvedValue(undefined);

      await expect(
        service.getTeamById('non-existent-id', testUserId)
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getTeamById('non-existent-id', testUserId)
      ).rejects.toThrow('Team not found');
    });

    it('should throw ForbiddenException when user does not own team', async () => {
      const team = createMockTeam({ userId: otherUserId });
      mockDbService.getTeam.mockResolvedValue(team);

      await expect(
        service.getTeamById(testTeamId, testUserId)
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.getTeamById(testTeamId, testUserId)
      ).rejects.toThrow('You do not have access to this team');
    });
  });

  describe('updateTeam', () => {
    const updateDTO: UpdateTeamDTO = {
      name: 'Updated Team Name',
      generation: 9,
      format: 'ou',
      pokemon: [
        createMockPokemon({ species: 'Charizard' as PokemonInTeam['species'] }),
      ],
    };

    it('should update team successfully when user owns it', async () => {
      const existingTeam = createMockTeam();
      const updatedTeam = createMockTeam({
        name: updateDTO.name,
        updatedAt: new Date('2024-06-01'),
      });

      mockDbService.getTeam.mockResolvedValue(existingTeam);
      mockDbService.updateTeam.mockResolvedValue(updatedTeam);

      const result = await service.updateTeam(
        testTeamId,
        testUserId,
        updateDTO
      );

      expect(mockDbService.getTeam).toHaveBeenCalledWith(testTeamId);
      expect(mockDbService.updateTeam).toHaveBeenCalledWith(testTeamId, {
        name: updateDTO.name,
        generation: updateDTO.generation,
        format: updateDTO.format,
        pokemon: updateDTO.pokemon,
      });
      expect(result.name).toBe(updateDTO.name);
    });

    it('should throw NotFoundException when team does not exist', async () => {
      mockDbService.getTeam.mockResolvedValue(undefined);

      await expect(
        service.updateTeam('non-existent-id', testUserId, updateDTO)
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateTeam('non-existent-id', testUserId, updateDTO)
      ).rejects.toThrow('Team not found');

      expect(mockDbService.updateTeam).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user does not own team', async () => {
      const team = createMockTeam({ userId: otherUserId });
      mockDbService.getTeam.mockResolvedValue(team);

      await expect(
        service.updateTeam(testTeamId, testUserId, updateDTO)
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.updateTeam(testTeamId, testUserId, updateDTO)
      ).rejects.toThrow('You do not have access to this team');

      expect(mockDbService.updateTeam).not.toHaveBeenCalled();
    });

    it('should call teamsDbService.updateTeam with correct parameters', async () => {
      const existingTeam = createMockTeam();
      const updatedTeam = createMockTeam({ name: updateDTO.name });

      mockDbService.getTeam.mockResolvedValue(existingTeam);
      mockDbService.updateTeam.mockResolvedValue(updatedTeam);

      await service.updateTeam(testTeamId, testUserId, updateDTO);

      expect(mockDbService.updateTeam).toHaveBeenCalledWith(testTeamId, {
        name: updateDTO.name,
        generation: updateDTO.generation,
        format: updateDTO.format,
        pokemon: updateDTO.pokemon,
      });
    });
  });

  describe('deleteTeam', () => {
    it('should delete team successfully', async () => {
      mockDbService.deleteTeam.mockResolvedValue(true);

      await expect(
        service.deleteTeam(testTeamId, testUserId)
      ).resolves.not.toThrow();

      expect(mockDbService.deleteTeam).toHaveBeenCalledWith(
        testTeamId,
        testUserId
      );
    });

    it('should throw NotFoundException when deletion fails', async () => {
      mockDbService.deleteTeam.mockResolvedValue(false);

      await expect(
        service.deleteTeam(testTeamId, testUserId)
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.deleteTeam(testTeamId, testUserId)
      ).rejects.toThrow('Team not found');
    });

    it('should pass both teamId and userId to deleteTeam', async () => {
      mockDbService.deleteTeam.mockResolvedValue(true);

      await service.deleteTeam(testTeamId, testUserId);

      expect(mockDbService.deleteTeam).toHaveBeenCalledWith(
        testTeamId,
        testUserId
      );
    });
  });
});
