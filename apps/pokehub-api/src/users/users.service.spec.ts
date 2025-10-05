import { UsersService } from './users.service';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { USERS_DB_SERVICE, User } from '@pokehub/backend/pokehub-users-db';
import { AppLogger } from '@pokehub/backend/shared-logger';
import { UserCore } from '@pokehub/shared/shared-user-models';

describe('UsersService', () => {
  let service: UsersService;

  const mockDbService = {
    getUser: jest.fn(),
    getUserByEmail: jest.fn(),
    getUserByUsername: jest.fn(),
    createUser: jest.fn(),
    updateUserProfile: jest.fn(),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: USERS_DB_SERVICE,
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

    service = module.get<UsersService>(UsersService);

    // Mock the config service to return fake azure credentials
    mockConfigService.get.mockReturnValue({
      storageAccount: {
        name: 'pokehubtest',
        avatarContainerName: 'avatars',
      },
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserCore', () => {
    it('should return a user with a fully formed avatarUrl if avatarFilename exists', async () => {
      const userId = '123-abc';
      const mockUser: User = {
        id: userId,
        email: 'test@test.com',
        username: 'testuser',
        accountRole: 'USER',
        accountType: 'GOOGLE',
        avatarFilename: 'my-avatar.png',
      };
      mockDbService.getUser.mockResolvedValue(mockUser);

      const result: UserCore | undefined = await service.getUserCore(
        userId,
        'id'
      );

      expect(result).toBeDefined();
      expect(mockDbService.getUser).toHaveBeenCalledWith(userId);
      expect(mockConfigService.get).toHaveBeenCalledWith('azure', {
        infer: true,
      });
      expect(result?.avatarUrl).toBe(
        'https://pokehubtest.blob.core.windows.net/avatars/123-abc/my-avatar.png'
      );
      expect(result?.username).toBe('testuser');
    });

    it('should return a user with a null avatarUrl if avatarFilename is null', async () => {
      const userId = '456-def';
      const mockUser: User = {
        id: userId,
        email: 'test2@test.com',
        username: 'testuser2',
        accountRole: 'USER',
        accountType: 'GOOGLE',
        avatarFilename: null,
      };
      mockDbService.getUser.mockResolvedValue(mockUser);

      const result: UserCore | undefined = await service.getUserCore(
        userId,
        'id'
      );

      expect(result).toBeDefined();
      expect(result?.avatarUrl).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should return a new user with a null avatarUrl', async () => {
      const newUserEmail = 'new@test.com';
      const mockUser: User = {
        id: '789-ghi',
        email: newUserEmail,
        username: null,
        accountRole: 'USER',
        accountType: 'GOOGLE',
        avatarFilename: null,
      };
      mockDbService.createUser.mockResolvedValue(mockUser);

      const result = await service.createUser(newUserEmail, 'GOOGLE');

      expect(result).toBeDefined();
      expect(result.avatarUrl).toBeNull();
    });

    it('should return a correctly formed avatarUrl if a user is created with a default avatar', async () => {
      const newUserEmail = 'new2@test.com';
      const mockUser: User = {
        id: '101-jkl',
        email: newUserEmail,
        username: null,
        accountRole: 'USER',
        accountType: 'GOOGLE',
        avatarFilename: 'default.png',
      };
      mockDbService.createUser.mockResolvedValue(mockUser);

      const result = await service.createUser(newUserEmail, 'GOOGLE');

      expect(result).toBeDefined();
      expect(result.avatarUrl).toBe(
        'https://pokehubtest.blob.core.windows.net/avatars/101-jkl/default.png'
      );
    });
  });
});
