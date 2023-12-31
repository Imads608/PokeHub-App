import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, UserStatus } from '@pokehub/user/database';
import { TcpUserModule } from '../tcp/tcp.module';
import configuration from '../config/configuration';
import { CommonModule } from '../common/common.module';
import { HttpUserModule } from '../http/http.module';

@Module({
  imports: [
    TcpUserModule, HttpUserModule,
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
        synchronize: configService.get<boolean>('postgresCreds.sync'),
      }),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    CommonModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
