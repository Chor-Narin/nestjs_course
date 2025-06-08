
// src/notification/notification.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class NotificationService {
  constructor(@Inject('NOTIFICATION_OPTIONS') private options: any) {}

  notify(message: string) {
    switch (this.options.type) {
      case 'email':
        console.log(`[Email] ${message}`);
        break;
      case 'sms':
        console.log(`[SMS] ${message}`);
        break;
      case 'log':
      default:
        console.log(`[Log] ${message}`);
    }
  }
  
}