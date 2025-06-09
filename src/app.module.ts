import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { TaskModule } from './modules/task/task.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ChatModule } from './chat/chat-module';
import { MeetingModule } from './meeting/meeting.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(
      {
        isGlobal: true
      }
    ),
    UserModule, 
    TaskModule, 
    ChatModule,  
    // ScheduleModule.forRoot()
    MeetingModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
