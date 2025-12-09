import { TraceMiddleware } from '../common/middleware/trace.middleware';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';
import configuration from '../config/configuration';
import { TeamsModule } from '../teams/teams.module';
import { UsersModule } from '../users/users.module';
import { routes } from './app.routes';
import { CatchEverythingFilter } from './global-exceptions.filter';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, RouterModule } from '@nestjs/core';

@Module({
  imports: [
    CommonModule,
    AuthModule,
    UsersModule,
    TeamsModule,
    RouterModule.register(routes),
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      load: [configuration],
    }),
  ],
  exports: [],
  providers: [{ provide: APP_FILTER, useClass: CatchEverythingFilter }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TraceMiddleware).forRoutes('*');
  }
}
