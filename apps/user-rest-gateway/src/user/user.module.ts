import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { UserController } from './user.controller';

@Module({
  imports: [CommonModule, HttpModule],
  controllers: [UserController]
})
export class UserModule {}
