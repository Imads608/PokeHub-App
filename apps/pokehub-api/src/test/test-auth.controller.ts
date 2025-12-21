import type { PokeHubApiConfiguration } from '../config/configuration.model';
import {
  Body,
  Controller,
  Post,
  NotFoundException,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  USERS_DB_SERVICE,
  type IUsersDBService,
} from '@pokehub/backend/pokehub-users-db';
import {
  JWT_AUTH_SERVICE,
  type IJwtAuthService,
} from '@pokehub/backend/shared-auth-utils';
import { z } from 'zod';

/**
 * Test-only authentication controller
 *
 * SECURITY: Only enabled when NODE_ENV='test' or E2E_TESTING='true'
 * Used by E2E tests to create authenticated sessions without OAuth flow
 *
 * Industry Standard: Most production apps have test endpoints for E2E testing
 * Examples: Auth0 test tokens, Firebase emulator, AWS Cognito test users
 */

const CreateTestSessionDtoSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().nullable().optional(),
  userId: z.string().uuid().optional(),
});

type CreateTestSessionDto = z.infer<typeof CreateTestSessionDtoSchema>;

@Controller('auth')
export class TestAuthController {
  constructor(
    @Inject(JWT_AUTH_SERVICE)
    private readonly jwtService: IJwtAuthService,
    @Inject(USERS_DB_SERVICE)
    private readonly usersDbService: IUsersDBService,
    private readonly configService: ConfigService<PokeHubApiConfiguration, true>
  ) {}

  /**
   * Creates a test user and returns OAuth-compatible tokens
   *
   * POST /test/auth/create-session
   *
   * Request Body:
   * {
   *   email?: string,     // defaults to test@example.com
   *   username?: string,  // defaults to testuser
   *   userId?: string     // defaults to generated UUID
   * }
   *
   * Response (OAuth-compatible format):
   * {
   *   user: UserCore,
   *   tokens: {
   *     accessToken: { value: string, expirySeconds: number },
   *     refreshToken: string
   *   }
   * }
   */
  @Post('create-session')
  @HttpCode(HttpStatus.OK)
  async createTestSession(@Body() dto: CreateTestSessionDto) {
    // Security: Only allow in test/E2E environments
    const isTestEnv =
      process.env.NODE_ENV === 'test' || process.env.E2E_TESTING === 'true';

    if (!isTestEnv) {
      throw new NotFoundException();
    }

    // Validate input
    const validatedDto = CreateTestSessionDtoSchema.parse(dto);

    const email = validatedDto.email || 'test@example.com';
    // Keep username as undefined/null if not provided (for create-profile flow testing)
    const username = validatedDto.username;

    // Check if user exists
    let user = await this.usersDbService.getUserByEmail(email);

    if (!user) {
      // Create new test user (username will be null initially)
      user = await this.usersDbService.createUser(email, 'GOOGLE');
    }

    // Always sync username to match request for test consistency
    // This allows tests to reset user state between runs
    const targetUsername = username ?? null;
    if (user.username !== targetUsername) {
      user = await this.usersDbService.updateUserProfile(user.id, {
        username: targetUsername as string, // DB allows null despite type
        avatarFilename: user.avatarFilename || '',
      });
    }

    // Generate both access and refresh tokens (OAuth-compatible)
    const tokens = await this.jwtService.generateAccessAndRefreshTokens({
      id: user.id,
      email: user.email,
      accountRole: user.accountRole,
      accountType: user.accountType,
    });

    // Get secrets config for token expiry information
    const secretsConfig = this.configService.get('secrets', { infer: true });

    // Convert avatarFilename to avatarUrl
    const azureConfig = this.configService.get('azure', { infer: true });
    const avatarUrl = user.avatarFilename
      ? `https://${azureConfig.storageAccount.name}.blob.core.windows.net/${azureConfig.storageAccount.avatarContainerName}/${user.id}/${user.avatarFilename}`
      : null;

    // Return OAuth-compatible format matching /auth/oauth-login response
    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        accountRole: user.accountRole,
        accountType: user.accountType,
        avatarUrl,
      },
      tokens: {
        accessToken: {
          value: tokens.accessToken,
          expirySeconds: secretsConfig.ACCESS_TOKEN.expiryMinutes * 60,
        },
        refreshToken: tokens.refreshToken,
      },
    };
  }
}
