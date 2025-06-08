// src/notification/notification.module.ts
import { DynamicModule, Module } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Module({})
export class NotificationModule {
  static register(options: NotificationModule): DynamicModule {
    return {
      module: NotificationModule,
      providers: [
        {
          provide: 'NOTIFICATION_OPTIONS',
          useValue: options,
        },
        NotificationService,
      ],
      exports: [NotificationService],
    };
  }
}