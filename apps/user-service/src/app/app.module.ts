import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, UserStatus } from '@pokehub/user';
import { UserModule } from '../user/user.module';
import configuration from '../config/configuration';
import { LoggerModule } from '@pokehub/logger';

@Module({
  imports: [
    UserModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('postgresCreds.host'),
        port: +configService.get<number>('postgresCreds.port'),
        username: configService.get('postgresCreds.username'),
        password: configService.get('postgresCreds.password'),
        database: configService.get('postgresCreds.database'),
        entities: [User, UserStatus],
        synchronize: true,
      })
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration]
    }),
    LoggerModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
