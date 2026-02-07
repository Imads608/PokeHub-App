import { redisProvider, REDIS_SERVICE } from './redis.service';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppLoggerModule } from '@pokehub/backend/shared-logger';

@Module({
  imports: [ConfigModule, AppLoggerModule],
  providers: [redisProvider],
  exports: [REDIS_SERVICE],
})
export class PokehubRedisModule {}
