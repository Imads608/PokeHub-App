import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { HttpUserController } from './http.controller';

@Module({
  imports: [CommonModule],
  controllers: [HttpUserController],
})
export class HttpUserModule {}
