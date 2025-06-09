import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TelegramService } from '../telegram/telegram.service';
import { MeetingGateway } from '../websocket/meeting.gateway';
import { Meeting, MeetingNotification, ReminderType, ScheduledReminder } from '../interfaces/meeting.interface';

@Injectable()
export class MeetingSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MeetingSchedulerService.name);
  private readonly meetings = new Map<string, Meeting>();
  private readonly scheduledReminders = new Map<string, ScheduledReminder[]>();
  private checkInterval: NodeJS.Timeout;

  constructor(
    private readonly telegramService: TelegramService,
    private readonly meetingGateway: MeetingGateway,
  ) {}

  onModuleInit() {
    // Check every minute for due meetings and reminders
    this.checkInterval = setInterval(() => {
      this.checkDueMeetings();
      this.checkDueReminders();
    }, 60000); // Check every minute

    this.logger.log('Meeting scheduler service initialized');
  }

  onModuleDestroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    this.logger.log('Meeting scheduler service destroyed');
  }

  // Cron job to run every minute for more precise timing
  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    await this.checkDueMeetings();
    await this.checkDueReminders();
  }

  // Store meeting and schedule automatic reminders
  async scheduleMeeting(meeting: Meeting): Promise<void> {
    try {
      // Set initial status
      meeting.status = 'scheduled';
      meeting.remindersSent = [];

      // Store the meeting
      this.meetings.set(meeting.id, meeting);

      // Schedule automatic reminders
      await this.scheduleReminders(meeting);

      this.logger.log(`Meeting scheduled: ${meeting.id} - ${meeting.title}`);
    } catch (error) {
      this.logger.error('Error scheduling meeting', error);
      throw error;
    }
  }

  // Update existing meeting and reschedule reminders
  async updateMeeting(meeting: Meeting): Promise<void> {
    try {
      const existingMeeting = this.meetings.get(meeting.id);
      if (!existingMeeting) {
        throw new Error('Meeting not found');
      }

      // Preserve status and sent reminders if times haven't changed
      if (existingMeeting.startTime.getTime() === meeting.startTime.getTime()) {
        meeting.remindersSent = existingMeeting.remindersSent;
        meeting.status = existingMeeting.status;
      } else {
        // Reset reminders if time changed
        meeting.remindersSent = [];
        meeting.status = 'scheduled';
      }

      // Update the meeting
      this.meetings.set(meeting.id, meeting);

      // Reschedule reminders
      await this.scheduleReminders(meeting);

      this.logger.log(`Meeting updated: ${meeting.id} - ${meeting.title}`);
    } catch (error) {
      this.logger.error('Error updating meeting', error);
      throw error;
    }
  }

  // Cancel meeting and remove from scheduler
  async cancelMeeting(meetingId: string): Promise<void> {
    try {
      const meeting = this.meetings.get(meetingId);
      if (meeting) {
        meeting.status = 'cancelled';
        this.meetings.set(meetingId, meeting);
        
        // Remove scheduled reminders
        this.scheduledReminders.delete(meetingId);
        
        this.logger.log(`Meeting cancelled: ${meetingId} - ${meeting.title}`);
      }
    } catch (error) {
      this.logger.error('Error cancelling meeting', error);
      throw error;
    }
  }

  // Get all scheduled meetings
  getAllMeetings(): Meeting[] {
    return Array.from(this.meetings.values());
  }

  // Get meeting by ID
  getMeeting(meetingId: string): Meeting | undefined {
    return this.meetings.get(meetingId);
  }

  // Get upcoming meetings (next 24 hours)
  getUpcomingMeetings(): Meeting[] {
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    return Array.from(this.meetings.values()).filter(meeting => 
      meeting.status === 'scheduled' &&
      meeting.startTime > now &&
      meeting.startTime <= next24Hours
    );
  }

  private async scheduleReminders(meeting: Meeting): Promise<void> {
    if (meeting.status === 'cancelled') return;

    const reminders: ScheduledReminder[] = [];
    const now = new Date();

    // Define reminder times before meeting start
    const reminderTimes = [
      { type: '24h' as ReminderType, minutes: 24 * 60 },
      { type: '1h' as ReminderType, minutes: 60 },
      { type: '15min' as ReminderType, minutes: 15 },
      { type: '5min' as ReminderType, minutes: 5 },
    ];

    reminderTimes.forEach(({ type, minutes }) => {
      const reminderTime = new Date(meeting.startTime.getTime() - minutes * 60 * 1000);
      
      // Only schedule if reminder time is in the future and not already sent
      if (reminderTime > now && !meeting.remindersSent?.includes(type)) {
        reminders.push({
          meetingId: meeting.id,
          reminderType: type,
          reminderTime,
          sent: false,
        });
      }
    });

    this.scheduledReminders.set(meeting.id, reminders);
    this.logger.log(`Scheduled ${reminders.length} reminders for meeting: ${meeting.title}`);
  }

  private async checkDueReminders(): Promise<void> {
    const now = new Date();
    
    for (const [meetingId, reminders] of this.scheduledReminders.entries()) {
      const meeting = this.meetings.get(meetingId);
      if (!meeting || meeting.status !== 'scheduled') continue;

      for (const reminder of reminders) {
        if (!reminder.sent && reminder.reminderTime <= now) {
          try {
            await this.sendReminder(meeting, reminder.reminderType);
            reminder.sent = true;
            
            // Update meeting's sent reminders
            if (!meeting.remindersSent) meeting.remindersSent = [];
            meeting.remindersSent.push(reminder.reminderType);
            
            this.logger.log(`Sent ${reminder.reminderType} reminder for meeting: ${meeting.title}`);
          } catch (error) {
            this.logger.error(`Failed to send ${reminder.reminderType} reminder for meeting: ${meeting.title}`, error);
          }
        }
      }
    }
  }

  private async checkDueMeetings(): Promise<void> {
    const now = new Date();
    
    for (const [meetingId, meeting] of this.meetings.entries()) {
      if (meeting.status === 'cancelled') continue;

      try {
        // Check if meeting is starting (within 1 minute of start time)
        if (meeting.status === 'scheduled' && 
            meeting.startTime <= now && 
            meeting.startTime >= new Date(now.getTime() - 60000)) {
          await this.sendMeetingStarting(meeting);
          meeting.status = 'started';
          this.meetings.set(meetingId, meeting);
        }
        
        // Check if meeting has ended
        else if (meeting.status === 'started' && meeting.endTime <= now) {
          await this.sendMeetingEnded(meeting);
          meeting.status = 'ended';
          this.meetings.set(meetingId, meeting);
          
          // Clean up old reminders
          this.scheduledReminders.delete(meetingId);
        }
      } catch (error) {
        this.logger.error(`Error checking meeting status: ${meeting.title}`, error);
      }
    }
  }

  private async sendReminder(meeting: Meeting, reminderType: ReminderType): Promise<void> {
    const reminderMessages = {
      '24h': 'Meeting reminder: 24 hours to go',
      '1h': 'Meeting reminder: 1 hour to go',
      '15min': 'Meeting reminder: 15 minutes to go',
      '5min': 'Meeting reminder: 5 minutes to go - Please prepare to join',
    };

    const notification: MeetingNotification = {
      type: 'reminder',
      meeting,
      message: reminderMessages[reminderType],
    };

    // Send to Telegram
    await this.telegramService.sendMeetingNotification(notification);
    
    // Broadcast via WebSocket
    this.meetingGateway.server.emit('meeting:reminder', notification);
  }

  private async sendMeetingStarting(meeting: Meeting): Promise<void> {
    const notification: MeetingNotification = {
      type: 'starting',
      meeting,
      message: 'Meeting is starting now! Please join.',
    };

    // Send to Telegram
    await this.telegramService.sendMeetingNotification(notification);
    
    // Broadcast via WebSocket
    this.meetingGateway.server.emit('meeting:starting', notification);
  }

  private async sendMeetingEnded(meeting: Meeting): Promise<void> {
    const notification: MeetingNotification = {
      type: 'ended',
      meeting,
      message: 'Meeting has ended. Thank you for attending!',
    };

    // Send to Telegram
    await this.telegramService.sendMeetingNotification(notification);
    
    // Broadcast via WebSocket
    this.meetingGateway.server.emit('meeting:ended', notification);
  }

  // Manual method to send immediate reminder
  async sendImmediateReminder(meetingId: string): Promise<void> {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) {
      throw new Error('Meeting not found');
    }

    const notification: MeetingNotification = {
      type: 'reminder',
      meeting,
      message: 'Manual meeting reminder sent',
    };

    await this.telegramService.sendMeetingNotification(notification);
    this.meetingGateway.server.emit('meeting:reminder', notification);
  }

  // Get scheduler statistics
  getSchedulerStats() {
    const totalMeetings = this.meetings.size;
    const scheduledMeetings = Array.from(this.meetings.values()).filter(m => m.status === 'scheduled').length;
    const activeMeetings = Array.from(this.meetings.values()).filter(m => m.status === 'started').length;
    const totalReminders = Array.from(this.scheduledReminders.values()).reduce((sum, reminders) => sum + reminders.length, 0);
    const pendingReminders = Array.from(this.scheduledReminders.values()).reduce((sum, reminders) => sum + reminders.filter(r => !r.sent).length, 0);

    return {
      totalMeetings,
      scheduledMeetings,
      activeMeetings,
      totalReminders,
      pendingReminders,
      upcomingMeetings: this.getUpcomingMeetings().length,
    };
  }
}
