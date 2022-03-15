import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';
import { DMEventsGateway } from './dm-events.gateway';
import { RoomEventsGateway } from './room-events.gateway';

@Module({
    imports: [AuthModule, CommonModule],
    providers: [DMEventsGateway, RoomEventsGateway]
})
export class EventsModule {}
