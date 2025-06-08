import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from 'src/notification/notification.service';
import { dto } from './dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TaskService {

  constructor(private readonly notifier : NotificationService){}
  private readonly logger = new Logger(TaskService.name);

  createTask(body: dto) {
    console.log('Received body:', body); // Add this debug log
    if (!body) {
        throw new Error('Body is undefined');
    }
    this.notifier.notify(`Task "${body.name}" created`);
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  handleCronjob(){
    this.logger.debug('this cron job will run every 15 second')
  }
}
