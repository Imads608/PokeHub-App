import { UsersController } from './users.controller';
import { IUsersService, USERS_SERVICE } from './users.service.interface';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
  TokenAuthGuard,
  JWT_AUTH_SERVICE,
  type IJwtAuthService,
  type UserJwtData,
} from '@pokehub/backend/shared-auth-utils';
import { AppLogger } from '@pokehub/backend/shared-logger';
import type { IUpdateUserProfile } from '@pokehub/shared/shared-user-models';
import request from 'supertest';

describe('UsersController', () => {
  let app: INestApplication;
  let controller: UsersController;
  let mockUsersService: jest.Mocked<IUsersService>;
  let mockJwtService: jest.Mocked<IJwtAuthService>;

  const testUserId = 'user-123';
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

  beforeEach(async () => {
    mockUsersService = {
      updateUserProfile: jest.fn(),
      getUserCore: jest.fn(),
      createUser: jest.fn(),
      getAvatarUrl: jest.fn(),
    };

    mockJwtService = {
      generateAccessAndRefreshTokens: jest.fn(),
      generateToken: jest.fn(),
      validateToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: USERS_SERVICE,
          useValue: mockUsersService,
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

    controller = module.get<UsersController>(UsersController);

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

  describe('POST /:userId/profile (updateUserProfile)', () => {
    const validProfileData: IUpdateUserProfile = {
      username: 'newusername',
      avatar: 'avatar.png',
    };

    beforeEach(() => {
      mockJwtService.validateToken.mockResolvedValue(mockUser);
    });

    it('should update profile with valid data (201)', async () => {
      const responseData: IUpdateUserProfile = {
        username: 'newusername',
        avatar:
          'https://storage.blob.core.windows.net/avatars/user-123/avatar.png',
      };
      mockUsersService.updateUserProfile.mockResolvedValue(responseData);

      const response = await request(app.getHttpServer())
        .post(`/${testUserId}/profile`)
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send(validProfileData)
        .expect(HttpStatus.CREATED);

      expect(response.body).toEqual(responseData);
      expect(mockUsersService.updateUserProfile).toHaveBeenCalledWith(
        testUserId,
        validProfileData
      );
    });

    it('should update profile with username only', async () => {
      const usernameOnly = { username: 'onlyusername' };
      const responseData: IUpdateUserProfile = { username: 'onlyusername' };
      mockUsersService.updateUserProfile.mockResolvedValue(responseData);

      const response = await request(app.getHttpServer())
        .post(`/${testUserId}/profile`)
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send(usernameOnly)
        .expect(HttpStatus.CREATED);

      expect(response.body).toEqual(responseData);
      expect(mockUsersService.updateUserProfile).toHaveBeenCalledWith(
        testUserId,
        usernameOnly
      );
    });

    it('should return 403 without auth token', async () => {
      mockJwtService.validateToken.mockRejectedValue(new Error('Unauthorized'));

      await request(app.getHttpServer())
        .post(`/${testUserId}/profile`)
        .send(validProfileData)
        .expect(HttpStatus.FORBIDDEN);

      expect(mockUsersService.updateUserProfile).not.toHaveBeenCalled();
    });

    it('should return 400 with username too short', async () => {
      const invalidData = { username: 'ab' };

      await request(app.getHttpServer())
        .post(`/${testUserId}/profile`)
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockUsersService.updateUserProfile).not.toHaveBeenCalled();
    });

    it('should return 400 with username too long', async () => {
      const invalidData = { username: 'a'.repeat(21) };

      await request(app.getHttpServer())
        .post(`/${testUserId}/profile`)
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockUsersService.updateUserProfile).not.toHaveBeenCalled();
    });

    it('should return 400 with invalid avatar filename', async () => {
      const invalidData = { username: 'validuser', avatar: 'invalid@file.exe' };

      await request(app.getHttpServer())
        .post(`/${testUserId}/profile`)
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockUsersService.updateUserProfile).not.toHaveBeenCalled();
    });

    it('should return 400 when username is missing', async () => {
      await request(app.getHttpServer())
        .post(`/${testUserId}/profile`)
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({})
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockUsersService.updateUserProfile).not.toHaveBeenCalled();
    });

    it('should accept valid avatar extensions (png, jpg, jpeg, gif)', async () => {
      const extensions = ['png', 'jpg', 'jpeg', 'gif'];

      for (const ext of extensions) {
        mockUsersService.updateUserProfile.mockResolvedValue({
          username: 'testuser',
          avatar: `avatar.${ext}`,
        });

        await request(app.getHttpServer())
          .post(`/${testUserId}/profile`)
          .set('Authorization', `Bearer ${validAccessToken}`)
          .send({ username: 'testuser', avatar: `avatar.${ext}` })
          .expect(HttpStatus.CREATED);
      }
    });
  });

  describe('HEAD /:id (getUserCore - username availability)', () => {
    beforeEach(() => {
      mockJwtService.validateToken.mockResolvedValue(mockUser);
    });

    it('should return 200 when user exists', async () => {
      mockUsersService.getUserCore.mockResolvedValue({
        id: 'user-456',
        username: 'existinguser',
        email: 'existing@test.com',
        accountType: 'GOOGLE',
        accountRole: 'USER',
        avatarUrl: null,
      });

      await request(app.getHttpServer())
        .head('/existinguser?dataType=username')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .expect(HttpStatus.OK);

      expect(mockUsersService.getUserCore).toHaveBeenCalledWith(
        'existinguser',
        'username'
      );
    });

    it('should return 404 when user does not exist', async () => {
      mockUsersService.getUserCore.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .head('/nonexistent?dataType=username')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .expect(HttpStatus.NOT_FOUND);

      expect(mockUsersService.getUserCore).toHaveBeenCalledWith(
        'nonexistent',
        'username'
      );
    });

    it('should return 403 without auth token', async () => {
      mockJwtService.validateToken.mockRejectedValue(new Error('Unauthorized'));

      await request(app.getHttpServer())
        .head('/someuser?dataType=username')
        .expect(HttpStatus.FORBIDDEN);

      expect(mockUsersService.getUserCore).not.toHaveBeenCalled();
    });

    it('should check by email when dataType is email', async () => {
      mockUsersService.getUserCore.mockResolvedValue({
        id: 'user-789',
        username: 'emailuser',
        email: 'test@example.com',
        accountType: 'GOOGLE',
        accountRole: 'USER',
        avatarUrl: null,
      });

      await request(app.getHttpServer())
        .head('/test@example.com?dataType=email')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .expect(HttpStatus.OK);

      expect(mockUsersService.getUserCore).toHaveBeenCalledWith(
        'test@example.com',
        'email'
      );
    });

    it('should check by id when dataType is id', async () => {
      mockUsersService.getUserCore.mockResolvedValue({
        id: 'user-abc',
        username: 'iduser',
        email: 'id@test.com',
        accountType: 'GOOGLE',
        accountRole: 'USER',
        avatarUrl: null,
      });

      await request(app.getHttpServer())
        .head('/user-abc?dataType=id')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .expect(HttpStatus.OK);

      expect(mockUsersService.getUserCore).toHaveBeenCalledWith(
        'user-abc',
        'id'
      );
    });
  });
});
