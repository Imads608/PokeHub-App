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
    deleteUser: jest.fn(),
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

  describe('updateUserProfile', () => {
    const userId = 'user-123';

    // User without username (new user creating profile for first time)
    const mockUserWithoutUsername: User = {
      id: userId,
      email: 'test@test.com',
      username: null,
      accountRole: 'USER',
      accountType: 'GOOGLE',
      avatarFilename: null,
    };

    // User with existing username (returning user updating avatar)
    const mockUserWithUsername: User = {
      id: userId,
      email: 'test@test.com',
      username: 'existinguser',
      accountRole: 'USER',
      accountType: 'GOOGLE',
      avatarFilename: 'old-avatar.png',
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should update profile with username only and return data without avatar URL', async () => {
      const profileData = { username: 'newusername' };
      mockDbService.getUser.mockResolvedValue(mockUserWithoutUsername);
      mockDbService.updateUserProfile.mockResolvedValue(undefined);

      const result = await service.updateUserProfile(userId, profileData);

      expect(mockDbService.getUser).toHaveBeenCalledWith(userId);
      expect(mockDbService.updateUserProfile).toHaveBeenCalledWith(userId, {
        username: 'newusername',
        avatarFilename: undefined,
      });
      expect(result).toEqual({ username: 'newusername' });
    });

    it('should update profile with avatar and return data with full avatar URL', async () => {
      const profileData = { username: 'newusername', avatar: 'myavatar.png' };
      mockDbService.getUser.mockResolvedValue(mockUserWithoutUsername);
      mockDbService.updateUserProfile.mockResolvedValue(undefined);

      const result = await service.updateUserProfile(userId, profileData);

      expect(mockDbService.updateUserProfile).toHaveBeenCalledWith(userId, {
        username: 'newusername',
        avatarFilename: 'avatar.png',
      });
      expect(result).toEqual({
        username: 'newusername',
        avatar:
          'https://pokehubtest.blob.core.windows.net/avatars/user-123/avatar.png',
      });
    });

    it('should handle avatar with jpg extension', async () => {
      const profileData = { username: 'testuser', avatar: 'photo.jpg' };
      mockDbService.getUser.mockResolvedValue(mockUserWithoutUsername);
      mockDbService.updateUserProfile.mockResolvedValue(undefined);

      const result = await service.updateUserProfile(userId, profileData);

      expect(mockDbService.updateUserProfile).toHaveBeenCalledWith(userId, {
        username: 'testuser',
        avatarFilename: 'avatar.jpg',
      });
      expect(result.avatar).toBe(
        'https://pokehubtest.blob.core.windows.net/avatars/user-123/avatar.jpg'
      );
    });

    it('should handle avatar with jpeg extension', async () => {
      const profileData = { username: 'testuser', avatar: 'image.jpeg' };
      mockDbService.getUser.mockResolvedValue(mockUserWithoutUsername);
      mockDbService.updateUserProfile.mockResolvedValue(undefined);

      const result = await service.updateUserProfile(userId, profileData);

      expect(mockDbService.updateUserProfile).toHaveBeenCalledWith(userId, {
        username: 'testuser',
        avatarFilename: 'avatar.jpeg',
      });
      expect(result.avatar).toContain('avatar.jpeg');
    });

    it('should update avatar only for user with existing username', async () => {
      const profileData = { avatar: 'new-photo.png' };
      mockDbService.getUser.mockResolvedValue(mockUserWithUsername);
      mockDbService.updateUserProfile.mockResolvedValue(undefined);

      const result = await service.updateUserProfile(userId, profileData);

      expect(mockDbService.updateUserProfile).toHaveBeenCalledWith(userId, {
        username: undefined,
        avatarFilename: 'avatar.png',
      });
      expect(result.avatar).toBe(
        'https://pokehubtest.blob.core.windows.net/avatars/user-123/avatar.png'
      );
    });

    it('should throw error when trying to change existing username', async () => {
      const profileData = { username: 'newusername' };
      mockDbService.getUser.mockResolvedValue(mockUserWithUsername);

      await expect(
        service.updateUserProfile(userId, profileData)
      ).rejects.toThrow('Username cannot be changed once set');
    });

    it('should throw error when user without username tries to update avatar only', async () => {
      const profileData = { avatar: 'new-photo.png' };
      mockDbService.getUser.mockResolvedValue(mockUserWithoutUsername);

      await expect(
        service.updateUserProfile(userId, profileData)
      ).rejects.toThrow('Username is required for users without a username');
    });

    it('should throw error when user is not found', async () => {
      const profileData = { username: 'testuser' };
      mockDbService.getUser.mockResolvedValue(null);

      await expect(
        service.updateUserProfile(userId, profileData)
      ).rejects.toThrow('User not found');
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

  describe('deleteUser', () => {
    const userId = 'user-to-delete-123';

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should call usersDbService.deleteUser with userId', async () => {
      mockDbService.deleteUser.mockResolvedValue(undefined);

      await service.deleteUser(userId);

      expect(mockDbService.deleteUser).toHaveBeenCalledWith(userId);
    });

    it('should log deletion request', async () => {
      mockDbService.deleteUser.mockResolvedValue(undefined);

      await service.deleteUser(userId);

      expect(mockLogger.log).toHaveBeenCalled();
    });
  });
});
