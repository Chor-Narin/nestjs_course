import { Module } from '@nestjs/common';
import { TasksController } from './task.controller';
import { TaskService } from './task.service';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [NotificationModule.register({type : 'log'})],
  controllers: [TasksController],
  providers: [TaskService],
  exports: [],
  // Add any other necessary configurations or modules
})
export class TaskModule {}
