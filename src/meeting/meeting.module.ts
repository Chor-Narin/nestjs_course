import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegramService } from '../telegram/telegram.service';
import { MeetingGateway } from '../websocket/meeting.gateway';
import { MeetingController } from './meeting.controller';
import { MeetingSchedulerService } from 'src/services/meeting-scheduler.service';

@Module({
  imports: [ConfigModule],
  controllers: [MeetingController],
  providers: [
    TelegramService, 
    MeetingGateway,
    MeetingSchedulerService
],
  exports: [TelegramService, MeetingGateway],
})
export class MeetingModule {}