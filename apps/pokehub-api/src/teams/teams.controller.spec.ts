import { TeamsController } from './teams.controller';
import { ITeamsService, TEAMS_SERVICE } from './teams.service.interface';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  TokenAuthGuard,
  JWT_AUTH_SERVICE,
  type IJwtAuthService,
  type UserJwtData,
} from '@pokehub/backend/shared-auth-utils';
import { AppLogger } from '@pokehub/backend/shared-logger';
import { ConfigService } from '@nestjs/config';
import type {
  CreateTeamDTO,
  UpdateTeamDTO,
  TeamResponseDTO,
  PokemonInTeam,
} from '@pokehub/shared/pokemon-types';
import request from 'supertest';

describe('TeamsController', () => {
  let app: INestApplication;
  let controller: TeamsController;
  let mockTeamsService: jest.Mocked<ITeamsService>;
  let mockJwtService: jest.Mocked<IJwtAuthService>;

  const testUserId = 'user-123';
  const testTeamId = 'team-abc';
  const validAccessToken = 'valid-access-token';

  const mockUser: UserJwtData = {
    id: testUserId,
    email: 'test@example.com',
    accountType: 'GOOGLE',
    accountRole: 'USER',
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    setContext: jest.fn(),
  };

  // Use valid Pokemon data that passes both Zod and @pkmn/sim validation
  // Level 100 is standard for OU format
  const createMockPokemon = (
    overrides?: Partial<PokemonInTeam>
  ): PokemonInTeam => ({
    species: 'Pikachu' as PokemonInTeam['species'],
    name: '',
    ability: 'Static' as PokemonInTeam['ability'],
    item: 'Light Ball' as PokemonInTeam['item'],
    nature: 'Timid' as PokemonInTeam['nature'],
    gender: 'M',
    level: 100,
    moves: ['Thunderbolt', 'Volt Switch', 'Nuzzle', 'Quick Attack'] as PokemonInTeam['moves'],
    evs: { hp: 0, atk: 0, def: 0, spa: 252, spd: 4, spe: 252 },
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    ...overrides,
  });

  const createMockTeamResponse = (
    overrides?: Partial<TeamResponseDTO>
  ): TeamResponseDTO => ({
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

  beforeEach(async () => {
    mockTeamsService = {
      createTeam: jest.fn(),
      getUserTeams: jest.fn(),
      getTeamById: jest.fn(),
      updateTeam: jest.fn(),
      deleteTeam: jest.fn(),
    };

    mockJwtService = {
      generateAccessAndRefreshTokens: jest.fn(),
      generateToken: jest.fn(),
      validateToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamsController],
      providers: [
        {
          provide: TEAMS_SERVICE,
          useValue: mockTeamsService,
        },
        {
          provide: AppLogger,
          useValue: mockLogger,
        },
        {
          provide: JWT_AUTH_SERVICE,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
        TokenAuthGuard,
        Reflector,
      ],
    }).compile();

    controller = module.get<TeamsController>(TeamsController);

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('controller instance', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });

  describe('POST /teams (createTeam)', () => {
    const createTeamDTO = createMockCreateTeamDTO();

    beforeEach(() => {
      mockJwtService.validateToken.mockResolvedValue(mockUser);
      mockTeamsService.createTeam.mockResolvedValue(createMockTeamResponse());
    });

    it('should create a team successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send(createTeamDTO);

      // Log the response body if test fails to help debug validation errors
      if (response.status !== HttpStatus.CREATED) {
        console.log('Validation failed. Response body:', JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body).toMatchObject({
        id: testTeamId,
        name: 'Test Team',
        generation: 9,
        format: 'ou',
      });
      expect(mockTeamsService.createTeam).toHaveBeenCalledWith(
        testUserId,
        expect.objectContaining({
          name: 'Test Team',
          generation: 9,
          format: 'ou',
        })
      );
    });

    it('should return 401 when no token provided', async () => {
      await request(app.getHttpServer())
        .post('/')
        .send(createTeamDTO)
        .expect(HttpStatus.FORBIDDEN);

      expect(mockTeamsService.createTeam).not.toHaveBeenCalled();
    });

    it('should return 401 when invalid token provided', async () => {
      mockJwtService.validateToken.mockRejectedValue(new Error('Invalid token'));

      await request(app.getHttpServer())
        .post('/')
        .set('Authorization', 'Bearer invalid-token')
        .send(createTeamDTO)
        .expect(HttpStatus.FORBIDDEN);

      expect(mockTeamsService.createTeam).not.toHaveBeenCalled();
    });

    it('should return 400 when team name is missing', async () => {
      const invalidDTO = { ...createTeamDTO, name: undefined };

      await request(app.getHttpServer())
        .post('/')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send(invalidDTO)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 when generation is invalid', async () => {
      const invalidDTO = { ...createTeamDTO, generation: 0 };

      await request(app.getHttpServer())
        .post('/')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send(invalidDTO)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 when pokemon array is empty', async () => {
      const invalidDTO = { ...createTeamDTO, pokemon: [] };

      await request(app.getHttpServer())
        .post('/')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send(invalidDTO)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 when pokemon has no moves', async () => {
      const invalidDTO = {
        ...createTeamDTO,
        pokemon: [createMockPokemon({ moves: [] })],
      };

      await request(app.getHttpServer())
        .post('/')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send(invalidDTO)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /teams (getUserTeams)', () => {
    beforeEach(() => {
      mockJwtService.validateToken.mockResolvedValue(mockUser);
    });

    it('should return user teams successfully', async () => {
      const teams = [
        createMockTeamResponse({ id: 'team-1', name: 'Team 1' }),
        createMockTeamResponse({ id: 'team-2', name: 'Team 2' }),
      ];
      mockTeamsService.getUserTeams.mockResolvedValue(teams);

      const response = await request(app.getHttpServer())
        .get('/')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('Team 1');
      expect(response.body[1].name).toBe('Team 2');
      expect(mockTeamsService.getUserTeams).toHaveBeenCalledWith(testUserId);
    });

    it('should return empty array when user has no teams', async () => {
      mockTeamsService.getUserTeams.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual([]);
    });

    it('should return 401 when no token provided', async () => {
      await request(app.getHttpServer())
        .get('/')
        .expect(HttpStatus.FORBIDDEN);

      expect(mockTeamsService.getUserTeams).not.toHaveBeenCalled();
    });
  });

  describe('GET /teams/:id (getTeamById)', () => {
    beforeEach(() => {
      mockJwtService.validateToken.mockResolvedValue(mockUser);
    });

    it('should return team by id successfully', async () => {
      const team = createMockTeamResponse();
      mockTeamsService.getTeamById.mockResolvedValue(team);

      const response = await request(app.getHttpServer())
        .get(`/${testTeamId}`)
        .set('Authorization', `Bearer ${validAccessToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.id).toBe(testTeamId);
      expect(response.body.name).toBe('Test Team');
      expect(mockTeamsService.getTeamById).toHaveBeenCalledWith(
        testTeamId,
        testUserId
      );
    });

    it('should return 401 when no token provided', async () => {
      await request(app.getHttpServer())
        .get(`/${testTeamId}`)
        .expect(HttpStatus.FORBIDDEN);

      expect(mockTeamsService.getTeamById).not.toHaveBeenCalled();
    });
  });

  describe('PUT /teams/:id (updateTeam)', () => {
    const updateTeamDTO: UpdateTeamDTO = {
      name: 'Updated Team',
      generation: 9,
      format: 'ou',
      pokemon: [createMockPokemon()],
    };

    beforeEach(() => {
      mockJwtService.validateToken.mockResolvedValue(mockUser);
      mockTeamsService.updateTeam.mockResolvedValue(
        createMockTeamResponse({ name: 'Updated Team' })
      );
    });

    it('should update team successfully', async () => {
      const response = await request(app.getHttpServer())
        .put(`/${testTeamId}`)
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send(updateTeamDTO)
        .expect(HttpStatus.OK);

      expect(response.body.name).toBe('Updated Team');
      expect(mockTeamsService.updateTeam).toHaveBeenCalledWith(
        testTeamId,
        testUserId,
        expect.objectContaining({ name: 'Updated Team' })
      );
    });

    it('should return 401 when no token provided', async () => {
      await request(app.getHttpServer())
        .put(`/${testTeamId}`)
        .send(updateTeamDTO)
        .expect(HttpStatus.FORBIDDEN);

      expect(mockTeamsService.updateTeam).not.toHaveBeenCalled();
    });

    it('should return 400 when update data is invalid', async () => {
      const invalidDTO = { pokemon: [createMockPokemon({ moves: [] })] };

      await request(app.getHttpServer())
        .put(`/${testTeamId}`)
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send(invalidDTO)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should allow updates with required fields', async () => {
      const partialDTO: UpdateTeamDTO = {
        name: 'New Name Only',
        generation: 9,
        format: 'ou',
        pokemon: [createMockPokemon()],
      };

      await request(app.getHttpServer())
        .put(`/${testTeamId}`)
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send(partialDTO)
        .expect(HttpStatus.OK);

      expect(mockTeamsService.updateTeam).toHaveBeenCalledWith(
        testTeamId,
        testUserId,
        expect.objectContaining({ name: 'New Name Only' })
      );
    });
  });

  describe('DELETE /teams/:id (deleteTeam)', () => {
    beforeEach(() => {
      mockJwtService.validateToken.mockResolvedValue(mockUser);
      mockTeamsService.deleteTeam.mockResolvedValue(undefined);
    });

    it('should delete team successfully with 204 response', async () => {
      await request(app.getHttpServer())
        .delete(`/${testTeamId}`)
        .set('Authorization', `Bearer ${validAccessToken}`)
        .expect(HttpStatus.NO_CONTENT);

      expect(mockTeamsService.deleteTeam).toHaveBeenCalledWith(
        testTeamId,
        testUserId
      );
    });

    it('should return 401 when no token provided', async () => {
      await request(app.getHttpServer())
        .delete(`/${testTeamId}`)
        .expect(HttpStatus.FORBIDDEN);

      expect(mockTeamsService.deleteTeam).not.toHaveBeenCalled();
    });
  });

  describe('authorization', () => {
    it('should pass user data from token to service methods', async () => {
      const differentUser: UserJwtData = {
        id: 'different-user-id',
        email: 'different@example.com',
        accountType: 'GOOGLE',
        accountRole: 'USER',
      };
      mockJwtService.validateToken.mockResolvedValue(differentUser);
      mockTeamsService.getUserTeams.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .expect(HttpStatus.OK);

      expect(mockTeamsService.getUserTeams).toHaveBeenCalledWith('different-user-id');
    });

    it('should reject requests with expired tokens', async () => {
      mockJwtService.validateToken.mockRejectedValue(new Error('Token expired'));

      await request(app.getHttpServer())
        .get('/')
        .set('Authorization', 'Bearer expired-token')
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should reject requests with malformed authorization header', async () => {
      await request(app.getHttpServer())
        .get('/')
        .set('Authorization', 'InvalidFormat')
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockJwtService.validateToken.mockResolvedValue(mockUser);
    });

    it('should propagate service errors', async () => {
      mockTeamsService.getUserTeams.mockRejectedValue(
        new Error('Database connection failed')
      );

      await request(app.getHttpServer())
        .get('/')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });
});
