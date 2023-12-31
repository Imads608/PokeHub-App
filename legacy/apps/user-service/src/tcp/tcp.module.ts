import { Module } from '@nestjs/common';
import { TcpUserController } from './tcp.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [TcpUserController],
})
export class TcpUserModule {}
