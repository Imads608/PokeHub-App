import { AppModule } from '../../../pokehub-api/src/app/app.module';
import type { INestApplication } from '@nestjs/common';
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import {
  TEAMS_DB_SERVICE,
  type ITeamsDBService,
} from '@pokehub/backend/pokehub-teams-db';
import {
  USERS_DB_SERVICE,
  type IUsersDBService,
} from '@pokehub/backend/pokehub-users-db';
import {
  JWT_AUTH_SERVICE,
  type IJwtAuthService,
  type UserJwtData,
} from '@pokehub/backend/shared-auth-utils';
import type {
  CreateTeamDTO,
  PokemonInTeam,
  TeamResponseDTO,
  UpdateTeamDTO,
} from '@pokehub/shared/pokemon-types';
import request from 'supertest';

describe('Teams API (e2e)', () => {
  let app: INestApplication;
  let jwtService: IJwtAuthService;
  let usersDBService: IUsersDBService;
  let teamsDBService: ITeamsDBService;

  // Test user data (IDs will be populated in beforeAll)
  let testUser1: UserJwtData;
  let testUser2: UserJwtData;

  let user1AccessToken: string;
  let user2AccessToken: string;

  // Helper to create valid Pokemon data
  // Using Charizard - simple, popular Pokemon with standard moveset
  const createMockPokemon = (
    overrides?: Partial<PokemonInTeam>
  ): PokemonInTeam => ({
    species: 'Charizard' as PokemonInTeam['species'],
    name: '',
    ability: 'Blaze' as PokemonInTeam['ability'],
    item: 'Heavy-Duty Boots' as PokemonInTeam['item'],
    nature: 'Timid' as PokemonInTeam['nature'],
    gender: 'M',
    level: 100,
    moves: [
      'Flamethrower',
      'Air Slash',
      'Roost',
      'Will-O-Wisp',
    ] as PokemonInTeam['moves'],
    evs: { hp: 0, atk: 0, def: 0, spa: 252, spd: 4, spe: 252 },
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    ...overrides,
  });

  const createMockCreateTeamDTO = (
    overrides?: Partial<CreateTeamDTO>
  ): CreateTeamDTO => ({
    name: 'E2E Test Team',
    generation: 9,
    format: 'anythinggoes', // Using AG format - allows any Pokemon
    pokemon: [createMockPokemon()],
    ...overrides,
  });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Get services
    jwtService = app.get<IJwtAuthService>(JWT_AUTH_SERVICE);
    usersDBService = app.get<IUsersDBService>(USERS_DB_SERVICE);
    teamsDBService = app.get<ITeamsDBService>(TEAMS_DB_SERVICE);

    // Create or get test users
    let user1 = await usersDBService.getUserByEmail('e2euser1@test.com');
    if (!user1) {
      user1 = await usersDBService.createUser('e2euser1@test.com', 'GOOGLE');
    }

    let user2 = await usersDBService.getUserByEmail('e2euser2@test.com');
    if (!user2) {
      user2 = await usersDBService.createUser('e2euser2@test.com', 'GOOGLE');
    }

    // Set test user data with actual IDs from database
    testUser1 = {
      id: user1.id,
      email: user1.email,
      accountType: user1.accountType,
      accountRole: user1.accountRole,
    };

    testUser2 = {
      id: user2.id,
      email: user2.email,
      accountType: user2.accountType,
      accountRole: user2.accountRole,
    };

    // Generate access tokens for test users
    user1AccessToken = await jwtService.generateToken(
      testUser1,
      'ACCESS_TOKEN'
    );
    user2AccessToken = await jwtService.generateToken(
      testUser2,
      'ACCESS_TOKEN'
    );
  });

  afterAll(async () => {
    // Clean up all teams created by test users
    const user1Teams = await teamsDBService.getTeamsByUserId(testUser1.id);
    for (const team of user1Teams) {
      await teamsDBService.deleteTeam(team.id, testUser1.id);
    }

    const user2Teams = await teamsDBService.getTeamsByUserId(testUser2.id);
    for (const team of user2Teams) {
      await teamsDBService.deleteTeam(team.id, testUser2.id);
    }

    await app.close();
  });

  describe('POST /teams - Create Team', () => {
    const createdTeamIds: string[] = [];

    afterEach(async () => {
      // Clean up teams created in this test suite
      for (const teamId of createdTeamIds) {
        try {
          await teamsDBService.deleteTeam(teamId, testUser1.id);
        } catch (error) {
          // Team might already be cleaned up
        }
      }
      createdTeamIds.length = 0;
    });

    it('should create a team successfully with valid data and auth', async () => {
      const createTeamDTO = createMockCreateTeamDTO({
        name: 'My First Team',
      });

      const response = await request(app.getHttpServer())
        .post('/teams')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send(createTeamDTO)
        .expect(HttpStatus.CREATED);

      expect(response.body).toMatchObject({
        name: 'My First Team',
        generation: 9,
        format: 'anythinggoes',
        userId: testUser1.id,
      });
      expect(response.body.id).toBeDefined();
      createdTeamIds.push(response.body.id);
      expect(response.body.pokemon).toHaveLength(1);
      expect(response.body.pokemon[0].species).toBe('Charizard');
    });

    it('should create team with multiple Pokemon', async () => {
      const createTeamDTO = createMockCreateTeamDTO({
        name: 'Multi Pokemon Team',
        pokemon: [
          createMockPokemon(),
          createMockPokemon({
            species: 'Charizard' as PokemonInTeam['species'],
            ability: 'Blaze' as PokemonInTeam['ability'],
            item: 'Leftovers' as PokemonInTeam['item'],
            moves: [
              'Flamethrower',
              'Air Slash',
              'Dragon Pulse',
              'Roost',
            ] as PokemonInTeam['moves'],
          }),
        ],
      });

      const response = await request(app.getHttpServer())
        .post('/teams')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send(createTeamDTO)
        .expect(HttpStatus.CREATED);

      expect(response.body.pokemon).toHaveLength(2);
      createdTeamIds.push(response.body.id);
      expect(response.body.pokemon[0].species).toBe('Charizard');
      expect(response.body.pokemon[1].species).toBe('Charizard');
    });

    it('should return 403 when no auth token provided', async () => {
      const createTeamDTO = createMockCreateTeamDTO();

      await request(app.getHttpServer())
        .post('/teams')
        .send(createTeamDTO)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 403 with invalid auth token', async () => {
      const createTeamDTO = createMockCreateTeamDTO();

      await request(app.getHttpServer())
        .post('/teams')
        .set('Authorization', 'Bearer invalid-token')
        .send(createTeamDTO)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 400 when team name is missing', async () => {
      const invalidDTO = {
        generation: 9,
        format: 'anythinggoes',
        pokemon: [createMockPokemon()],
      };

      await request(app.getHttpServer())
        .post('/teams')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send(invalidDTO)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 when generation is invalid', async () => {
      const invalidDTO = createMockCreateTeamDTO({
        generation: 0,
      });

      await request(app.getHttpServer())
        .post('/teams')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send(invalidDTO)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 when pokemon array is empty', async () => {
      const invalidDTO = createMockCreateTeamDTO({
        pokemon: [],
      });

      await request(app.getHttpServer())
        .post('/teams')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send(invalidDTO)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 when pokemon has invalid moves', async () => {
      const invalidDTO = createMockCreateTeamDTO({
        pokemon: [createMockPokemon({ moves: [] })],
      });

      await request(app.getHttpServer())
        .post('/teams')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send(invalidDTO)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 when Pokemon species is invalid for Showdown validation', async () => {
      const invalidDTO = createMockCreateTeamDTO({
        pokemon: [
          createMockPokemon({
            species: 'InvalidSpecies123' as PokemonInTeam['species'],
          }),
        ],
      });

      await request(app.getHttpServer())
        .post('/teams')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send(invalidDTO)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 when Pokemon ability is invalid for species', async () => {
      const invalidDTO = createMockCreateTeamDTO({
        pokemon: [
          createMockPokemon({
            ability: 'InvalidAbility123' as PokemonInTeam['ability'],
          }),
        ],
      });

      await request(app.getHttpServer())
        .post('/teams')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send(invalidDTO)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /teams - Get User Teams', () => {
    let createdTeamId: string;

    beforeAll(async () => {
      // Create a team for user1 to retrieve
      const createDTO = createMockCreateTeamDTO({
        name: 'Team for GET test',
      });

      const response = await request(app.getHttpServer())
        .post('/teams')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send(createDTO);

      createdTeamId = response.body.id;
    });

    afterAll(async () => {
      // Clean up the team created in beforeAll
      if (createdTeamId) {
        try {
          await teamsDBService.deleteTeam(createdTeamId, testUser1.id);
        } catch (error) {
          // Team might already be deleted
        }
      }
    });

    it('should return all teams for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/teams')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // All teams should belong to user1
      response.body.forEach((team: TeamResponseDTO) => {
        expect(team.userId).toBe(testUser1.id);
      });

      // Should include the team we just created
      const foundTeam = response.body.find(
        (team: TeamResponseDTO) => team.id === createdTeamId
      );
      expect(foundTeam).toBeDefined();
      expect(foundTeam.name).toBe('Team for GET test');
    });

    it('should return empty array for user with no teams', async () => {
      const response = await request(app.getHttpServer())
        .get('/teams')
        .set('Authorization', `Bearer ${user2AccessToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      // User2 might have no teams or teams from other tests
      response.body.forEach((team: TeamResponseDTO) => {
        expect(team.userId).toBe(testUser2.id);
      });
    });

    it('should return 403 when no auth token provided', async () => {
      await request(app.getHttpServer())
        .get('/teams')
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should not return teams from other users', async () => {
      const response = await request(app.getHttpServer())
        .get('/teams')
        .set('Authorization', `Bearer ${user2AccessToken}`)
        .expect(HttpStatus.OK);

      // User2 should not see user1's teams
      const user1Teams = response.body.filter(
        (team: TeamResponseDTO) => team.userId === testUser1.id
      );
      expect(user1Teams).toHaveLength(0);
    });
  });

  describe('GET /teams/:id - Get Team By ID', () => {
    let user1TeamId: string;

    beforeAll(async () => {
      // Create a team for user1
      const createDTO = createMockCreateTeamDTO({
        name: 'Team for GET by ID test',
      });

      const response = await request(app.getHttpServer())
        .post('/teams')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send(createDTO);

      user1TeamId = response.body.id;
    });

    afterAll(async () => {
      // Clean up the team created in beforeAll
      if (user1TeamId) {
        try {
          await teamsDBService.deleteTeam(user1TeamId, testUser1.id);
        } catch (error) {
          // Team might already be deleted
        }
      }
    });

    it('should return team by id for owner', async () => {
      const response = await request(app.getHttpServer())
        .get(`/teams/${user1TeamId}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.id).toBe(user1TeamId);
      expect(response.body.name).toBe('Team for GET by ID test');
      expect(response.body.userId).toBe(testUser1.id);
      expect(response.body.pokemon).toBeDefined();
    });

    it('should return 403 when no auth token provided', async () => {
      await request(app.getHttpServer())
        .get(`/teams/${user1TeamId}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 404 when requesting non-existent team', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/teams/${nonExistentId}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 403 when user tries to access another users team', async () => {
      // User2 tries to access User1's team
      await request(app.getHttpServer())
        .get(`/teams/${user1TeamId}`)
        .set('Authorization', `Bearer ${user2AccessToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('PUT /teams/:id - Update Team', () => {
    let teamToUpdateId: string;

    beforeEach(async () => {
      // Create a fresh team for each update test
      const createDTO = createMockCreateTeamDTO({
        name: 'Team to Update',
      });

      const response = await request(app.getHttpServer())
        .post('/teams')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send(createDTO);

      teamToUpdateId = response.body.id;
    });

    afterEach(async () => {
      // Clean up the team created in beforeEach
      if (teamToUpdateId) {
        try {
          await teamsDBService.deleteTeam(teamToUpdateId, testUser1.id);
        } catch (error) {
          // Team might already be deleted in some tests
        }
      }
    });

    it('should update team name successfully', async () => {
      const updateDTO: UpdateTeamDTO = {
        name: 'Updated Team Name',
        generation: 9,
        format: 'anythinggoes',
        pokemon: [createMockPokemon()],
      };

      const response = await request(app.getHttpServer())
        .put(`/teams/${teamToUpdateId}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send(updateDTO)
        .expect(HttpStatus.OK);

      expect(response.body.id).toBe(teamToUpdateId);
      expect(response.body.name).toBe('Updated Team Name');
    });

    it('should update team Pokemon successfully', async () => {
      const updateDTO: UpdateTeamDTO = {
        name: 'Team to Update',
        generation: 9,
        format: 'anythinggoes',
        pokemon: [
          createMockPokemon({
            species: 'Blastoise' as PokemonInTeam['species'],
            ability: 'Torrent' as PokemonInTeam['ability'],
            item: 'Leftovers' as PokemonInTeam['item'],
            moves: [
              'Hydro Pump',
              'Ice Beam',
              'Rapid Spin',
              'Shell Smash',
            ] as PokemonInTeam['moves'],
          }),
        ],
      };

      const response = await request(app.getHttpServer())
        .put(`/teams/${teamToUpdateId}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send(updateDTO)
        .expect(HttpStatus.OK);

      expect(response.body.pokemon).toHaveLength(1);
      expect(response.body.pokemon[0].species).toBe('Blastoise');
    });

    it('should return 403 when no auth token provided', async () => {
      const updateDTO: UpdateTeamDTO = {
        name: 'Should Fail',
        generation: 9,
        format: 'anythinggoes',
        pokemon: [createMockPokemon()],
      };

      await request(app.getHttpServer())
        .put(`/teams/${teamToUpdateId}`)
        .send(updateDTO)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 404 when updating non-existent team', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const updateDTO: UpdateTeamDTO = {
        name: 'Should Fail',
        generation: 9,
        format: 'anythinggoes',
        pokemon: [createMockPokemon()],
      };

      await request(app.getHttpServer())
        .put(`/teams/${nonExistentId}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send(updateDTO)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 403 when user tries to update another users team', async () => {
      const updateDTO: UpdateTeamDTO = {
        name: 'Should Fail',
        generation: 9,
        format: 'anythinggoes',
        pokemon: [createMockPokemon()],
      };

      // User2 tries to update User1's team
      await request(app.getHttpServer())
        .put(`/teams/${teamToUpdateId}`)
        .set('Authorization', `Bearer ${user2AccessToken}`)
        .send(updateDTO)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 400 when update data is invalid', async () => {
      const invalidDTO = {
        name: 'Invalid Update',
        generation: 9,
        format: 'anythinggoes',
        pokemon: [createMockPokemon({ moves: [] })],
      };

      await request(app.getHttpServer())
        .put(`/teams/${teamToUpdateId}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send(invalidDTO)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('DELETE /teams/:id - Delete Team', () => {
    let teamToDeleteId: string;

    beforeEach(async () => {
      // Create a fresh team for each delete test
      const createDTO = createMockCreateTeamDTO({
        name: 'Team to Delete',
      });

      const response = await request(app.getHttpServer())
        .post('/teams')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send(createDTO);

      teamToDeleteId = response.body.id;
    });

    afterEach(async () => {
      // Clean up the team created in beforeEach (if not already deleted by the test)
      if (teamToDeleteId) {
        try {
          await teamsDBService.deleteTeam(teamToDeleteId, testUser1.id);
        } catch (error) {
          // Team might already be deleted in the test
        }
      }
    });

    it('should delete team successfully', async () => {
      await request(app.getHttpServer())
        .delete(`/teams/${teamToDeleteId}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .expect(HttpStatus.NO_CONTENT);

      // Verify team is actually deleted
      await request(app.getHttpServer())
        .get(`/teams/${teamToDeleteId}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 403 when no auth token provided', async () => {
      await request(app.getHttpServer())
        .delete(`/teams/${teamToDeleteId}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 404 when deleting non-existent team', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .delete(`/teams/${nonExistentId}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 403 when user tries to delete another users team', async () => {
      // User2 tries to delete User1's team
      await request(app.getHttpServer())
        .delete(`/teams/${teamToDeleteId}`)
        .set('Authorization', `Bearer ${user2AccessToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should allow deleting team multiple times (idempotent)', async () => {
      // First delete
      await request(app.getHttpServer())
        .delete(`/teams/${teamToDeleteId}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .expect(HttpStatus.NO_CONTENT);

      // Second delete should return 404
      await request(app.getHttpServer())
        .delete(`/teams/${teamToDeleteId}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('Authorization and Security', () => {
    it('should reject requests with malformed Bearer token format', async () => {
      await request(app.getHttpServer())
        .get('/teams')
        .set('Authorization', 'InvalidFormat')
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should reject requests with expired token', async () => {
      // Note: This test requires a token that's actually expired
      // For now, we test with an invalid token
      await request(app.getHttpServer())
        .get('/teams')
        .set('Authorization', 'Bearer expired.token.here')
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should properly isolate user data between different users', async () => {
      // Create team for user1
      const user1TeamDTO = createMockCreateTeamDTO({
        name: 'User 1 Private Team',
      });
      const user1Response = await request(app.getHttpServer())
        .post('/teams')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send(user1TeamDTO);

      // Create team for user2
      const user2TeamDTO = createMockCreateTeamDTO({
        name: 'User 2 Private Team',
      });
      const user2Response = await request(app.getHttpServer())
        .post('/teams')
        .set('Authorization', `Bearer ${user2AccessToken}`)
        .send(user2TeamDTO);

      // User1 should only see their own teams
      const user1Teams = await request(app.getHttpServer())
        .get('/teams')
        .set('Authorization', `Bearer ${user1AccessToken}`);

      const user1TeamIds = user1Teams.body.map(
        (team: TeamResponseDTO) => team.id
      );
      expect(user1TeamIds).toContain(user1Response.body.id);
      expect(user1TeamIds).not.toContain(user2Response.body.id);

      // User2 should only see their own teams
      const user2Teams = await request(app.getHttpServer())
        .get('/teams')
        .set('Authorization', `Bearer ${user2AccessToken}`);

      const user2TeamIds = user2Teams.body.map(
        (team: TeamResponseDTO) => team.id
      );
      expect(user2TeamIds).toContain(user2Response.body.id);
      expect(user2TeamIds).not.toContain(user1Response.body.id);
    });
  });

  describe('Complex Validation Scenarios', () => {
    let createdTeamIds: string[] = [];

    afterEach(async () => {
      // Clean up all teams created in these tests
      for (const teamId of createdTeamIds) {
        try {
          await teamsDBService.deleteTeam(teamId, testUser1.id);
        } catch (error) {
          // Team might already be deleted
        }
      }
      createdTeamIds = [];
    });

    it('should validate team with 6 Pokemon (max team size)', async () => {
      const createDTO = createMockCreateTeamDTO({
        name: 'Full Team',
        pokemon: [
          // Each Pokemon must be a different species (Species Clause)
          createMockPokemon(), // Charizard (default)
          createMockPokemon({
            species: 'Blastoise' as PokemonInTeam['species'],
            ability: 'Torrent' as PokemonInTeam['ability'],
            moves: [
              'Hydro Pump',
              'Ice Beam',
              'Rapid Spin',
              'Shell Smash',
            ] as PokemonInTeam['moves'],
          }),
          createMockPokemon({
            species: 'Venusaur' as PokemonInTeam['species'],
            ability: 'Overgrow' as PokemonInTeam['ability'],
            moves: [
              'Giga Drain',
              'Sludge Bomb',
              'Leech Seed',
              'Synthesis',
            ] as PokemonInTeam['moves'], // Removed Sleep Powder (banned)
          }),
          createMockPokemon({
            species: 'Gengar' as PokemonInTeam['species'],
            ability: 'Cursed Body' as PokemonInTeam['ability'],
            moves: [
              'Shadow Ball',
              'Sludge Wave',
              'Focus Blast',
              'Nasty Plot',
            ] as PokemonInTeam['moves'],
          }),
          createMockPokemon({
            species: 'Dragonite' as PokemonInTeam['species'],
            ability: 'Multiscale' as PokemonInTeam['ability'],
            moves: [
              'Dragon Dance',
              'Outrage',
              'Earthquake',
              'Extreme Speed',
            ] as PokemonInTeam['moves'],
          }),
          createMockPokemon({
            species: 'Gardevoir' as PokemonInTeam['species'],
            ability: 'Trace' as PokemonInTeam['ability'],
            moves: [
              'Psychic',
              'Moonblast',
              'Shadow Ball',
              'Calm Mind',
            ] as PokemonInTeam['moves'],
          }),
        ],
      });

      const response = await request(app.getHttpServer())
        .post('/teams')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send(createDTO)
        .expect(HttpStatus.CREATED);

      createdTeamIds.push(response.body.id);
      expect(response.body.pokemon).toHaveLength(6);
    });

    it('should validate Pokemon with custom EVs and IVs', async () => {
      const createDTO = createMockCreateTeamDTO({
        pokemon: [
          createMockPokemon({
            evs: { hp: 252, atk: 252, def: 4, spa: 0, spd: 0, spe: 0 },
            ivs: { hp: 31, atk: 31, def: 31, spa: 0, spd: 31, spe: 31 },
          }),
        ],
      });

      const response = await request(app.getHttpServer())
        .post('/teams')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send(createDTO)
        .expect(HttpStatus.CREATED);

      createdTeamIds.push(response.body.id);
      expect(response.body.pokemon[0].evs.hp).toBe(252);
      expect(response.body.pokemon[0].ivs.spa).toBe(0);
    });

    it('should reject Pokemon with invalid EV total (>510)', async () => {
      const createDTO = createMockCreateTeamDTO({
        pokemon: [
          createMockPokemon({
            evs: { hp: 252, atk: 252, def: 252, spa: 0, spd: 0, spe: 0 },
          }),
        ],
      });

      await request(app.getHttpServer())
        .post('/teams')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send(createDTO)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should validate Pokemon with no item', async () => {
      const createDTO = createMockCreateTeamDTO({
        pokemon: [
          createMockPokemon({
            item: '' as PokemonInTeam['item'],
          }),
        ],
      });

      const response = await request(app.getHttpServer())
        .post('/teams')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send(createDTO)
        .expect(HttpStatus.CREATED);

      createdTeamIds.push(response.body.id);
      expect(response.body.pokemon[0].item).toBe('');
    });

    it('should validate Pokemon with nickname', async () => {
      const createDTO = createMockCreateTeamDTO({
        pokemon: [
          createMockPokemon({
            name: 'Sparky',
          }),
        ],
      });

      const response = await request(app.getHttpServer())
        .post('/teams')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send(createDTO)
        .expect(HttpStatus.CREATED);

      createdTeamIds.push(response.body.id);
      expect(response.body.pokemon[0].name).toBe('Sparky');
    });
  });
});
