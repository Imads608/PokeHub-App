import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '../common/common.module';
import configuration from '../config/configuration';
import { StatusEventsModule } from '../status/status-events.module';

@Module({
  imports: [CommonModule, StatusEventsModule, ConfigModule.forRoot({
    isGlobal: true,
    load: [configuration],
  })],
})
export class AppModule {}
