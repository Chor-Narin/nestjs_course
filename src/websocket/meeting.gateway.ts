// src/websocket/meeting.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { TelegramService } from '../telegram/telegram.service';
import { Meeting, MeetingNotification } from '../interfaces/meeting.interface';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MeetingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MeetingGateway.name);
  private connectedClients = new Set<string>();

  constructor(private telegramService: TelegramService) {}

  handleConnection(client: Socket): void {
    this.connectedClients.add(client.id);
    this.logger.log(`Client connected: ${client.id}`);
    this.logger.log(`Total connected clients: ${this.connectedClients.size}`);
  }

  handleDisconnect(client: Socket): void {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
    this.logger.log(`Total connected clients: ${this.connectedClients.size}`);
  }

  @SubscribeMessage('meeting:create')
  async handleMeetingCreate(
    @MessageBody() meeting: Meeting,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      this.logger.log(`Received meeting creation: ${meeting.title}`);
      
      const notification: MeetingNotification = {
        type: 'created',
        meeting,
        message: 'New meeting has been scheduled'
      };

      // Send to Telegram
      await this.telegramService.sendMeetingNotification(notification);
      
      // Broadcast to all connected clients
      this.server.emit('meeting:created', notification);
      
      // Send confirmation to the sender
      client.emit('meeting:create:success', {
        meetingId: meeting.id,
        message: 'Meeting created and notification sent'
      });
      
    } catch (error) {
      this.logger.error('Error handling meeting creation', error);
      client.emit('meeting:create:error', {
        error: 'Failed to create meeting notification'
      });
    }
  }

  @SubscribeMessage('meeting:update')
  async handleMeetingUpdate(
    @MessageBody() data: { meeting: Meeting; changes: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      this.logger.log(`Received meeting update: ${data.meeting.title}`);
      
      const notification: MeetingNotification = {
        type: 'updated',
        meeting: data.meeting,
        message: `Meeting updated: ${data.changes}`
      };

      await this.telegramService.sendMeetingNotification(notification);
      this.server.emit('meeting:updated', notification);
      
      client.emit('meeting:update:success', {
        meetingId: data.meeting.id,
        message: 'Meeting updated and notification sent'
      });
      
    } catch (error) {
      this.logger.error('Error handling meeting update', error);
      client.emit('meeting:update:error', {
        error: 'Failed to update meeting notification'
      });
    }
  }

  @SubscribeMessage('meeting:cancel')
  async handleMeetingCancel(
    @MessageBody() data: { meeting: Meeting; reason?: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      this.logger.log(`Received meeting cancellation: ${data.meeting.title}`);
      
      const notification: MeetingNotification = {
        type: 'cancelled',
        meeting: data.meeting,
        message: data.reason || 'Meeting has been cancelled'
      };

      await this.telegramService.sendMeetingNotification(notification);
      this.server.emit('meeting:cancelled', notification);
      
      client.emit('meeting:cancel:success', {
        meetingId: data.meeting.id,
        message: 'Meeting cancelled and notification sent'
      });
      
    } catch (error) {
      this.logger.error('Error handling meeting cancellation', error);
      client.emit('meeting:cancel:error', {
        error: 'Failed to cancel meeting notification'
      });
    }
  }

  @SubscribeMessage('meeting:reminder')
  async handleMeetingReminder(
    @MessageBody() meeting: Meeting,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      this.logger.log(`Sending meeting reminder: ${meeting.title}`);
      
      const notification: MeetingNotification = {
        type: 'reminder',
        meeting,
        message: 'Meeting reminder'
      };

      await this.telegramService.sendMeetingNotification(notification);
      this.server.emit('meeting:reminder', notification);
      
      client.emit('meeting:reminder:success', {
        meetingId: meeting.id,
        message: 'Meeting reminder sent'
      });
      
    } catch (error) {
      this.logger.error('Error sending meeting reminder', error);
      client.emit('meeting:reminder:error', {
        error: 'Failed to send meeting reminder'
      });
    }
  }

  // Method to get connection status
  @SubscribeMessage('connection:status')
  handleConnectionStatus(@ConnectedSocket() client: Socket): void {
    client.emit('connection:status', {
      connected: true,
      clientId: client.id,
      totalClients: this.connectedClients.size
    });
  }
}