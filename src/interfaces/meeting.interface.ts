export interface Meeting {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  participants: string[];
  location?: string;
  createdBy: string;
  remindersSent?: ReminderType[];
  status?: 'scheduled' | 'started' | 'ended' | 'cancelled';
}

export interface MeetingNotification {
  type: 'created' | 'updated' | 'cancelled' | 'reminder' | 'starting' | 'started' | 'ended';
  meeting: Meeting;
  message?: string;
}

export type ReminderType = '24h' | '1h' | '15min' | '5min';

export interface ScheduledReminder {
  meetingId: string;
  reminderType: ReminderType;
  reminderTime: Date;
  sent: boolean;
}