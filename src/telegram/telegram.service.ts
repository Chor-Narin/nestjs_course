import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Meeting, MeetingNotification } from '../interfaces/meeting.interface';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken = process.env.TELEGRAM_BOT_TOKEN;
  private readonly chatId = process.env.TELEGRAM_CHAT_ID;
  private readonly telegramApiUrl: string;

  constructor(private configService: ConfigService) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    this.chatId = this.configService.get<string>('TELEGRAM_CHAT_ID');
    this.telegramApiUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  async sendMeetingNotification(notification: MeetingNotification): Promise<void> {
    try {
      const message = this.formatMeetingMessage(notification);
      await this.sendMessage(message);
      this.logger.log(`Meeting notification sent: ${notification.meeting.title}`);
    } catch (error) {
      this.logger.error('Failed to send meeting notification', error);
      throw error;
    }
  }

  private formatMeetingMessage(notification: MeetingNotification): string {
    const { type, meeting, message } = notification;
    const emoji = this.getEmojiForType(type);
    const startTime = new Date(meeting.startTime).toLocaleString();
    const endTime = new Date(meeting.endTime).toLocaleString();

    let formattedMessage = `${emoji} *Meeting ${type.toUpperCase()}*\n\n`;
    formattedMessage += `📅 *Title:* ${meeting.title}\n`;
    
    if (meeting.description) {
      formattedMessage += `📝 *Description:* ${meeting.description}\n`;
    }
    
    formattedMessage += `⏰ *Start:* ${startTime}\n`;
    formattedMessage += `⏱️ *End:* ${endTime}\n`;
    formattedMessage += `👥 *Participants:* ${meeting.participants.join(', ')}\n`;
    
    if (meeting.location) {
      formattedMessage += `📍 *Location:* ${meeting.location}\n`;
    }
    
    formattedMessage += `👤 *Created by:* ${meeting.createdBy}\n`;
    
    if (message) {
      formattedMessage += `\n💬 *Note:* ${message}`;
    }

    return formattedMessage;
  }

  private getEmojiForType(type: string): string {
    const emojiMap = {
      created: '🆕',
      updated: '✏️',
      cancelled: '❌',
      reminder: '🔔'
    };
    return emojiMap[type] || '📢';
  }

  private async sendMessage(text: string): Promise<void> {
    const url = `${this.telegramApiUrl}/sendMessage`;
    const payload = {
      chat_id: this.chatId,
      text,
      parse_mode: 'Markdown'
    };

    await axios.post(url, payload);
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.telegramApiUrl}/getMe`);
      this.logger.log('Telegram bot connection successful');
      return response.data.ok;
    } catch (error) {
      this.logger.error('Telegram bot connection failed', error);
      return false;
    }
  }
}
