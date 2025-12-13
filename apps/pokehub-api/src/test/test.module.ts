import { TestAuthController } from './test-auth.controller';
import { Module } from '@nestjs/common';
import { UsersDBModule } from '@pokehub/backend/pokehub-users-db';
import { SharedAuthUtilsModule } from '@pokehub/backend/shared-auth-utils';

/**
 * Test module for E2E authentication
 * Only imported when NODE_ENV is 'test' or 'development'
 */
@Module({
  imports: [SharedAuthUtilsModule, UsersDBModule],
  controllers: [TestAuthController],
})
export class TestModule {}
