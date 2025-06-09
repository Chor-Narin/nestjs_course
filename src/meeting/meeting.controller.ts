
// src/meeting/meeting.controller.ts
import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Get,
  HttpStatus,
  HttpException,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TelegramService } from '../telegram/telegram.service';
import { MeetingGateway } from '../websocket/meeting.gateway';
import { MeetingSchedulerService } from '../services/meeting-scheduler.service';
import { CreateMeetingDto, UpdateMeetingDto, CancelMeetingDto } from '../dto/meeting.dto';
import { Meeting, MeetingNotification } from '../interfaces/meeting.interface';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('meetings')
@Controller('meetings')
@UsePipes(new ValidationPipe({ transform: true }))
export class MeetingController {
  constructor(
    private readonly telegramService: TelegramService,
    private readonly meetingGateway: MeetingGateway,
    private readonly meetingScheduler: MeetingSchedulerService,
  ) {}

  @Get('test/telegram')
  @ApiOperation({ summary: 'Test Telegram bot connection' })
  @ApiResponse({ status: 200, description: 'Connection test result' })
  async testTelegram() {
    try {
      const isConnected = await this.telegramService.testConnection();
      return {
        status: 'success',
        connected: isConnected,
        message: isConnected ? 'Telegram bot is connected' : 'Telegram bot connection failed'
      };
    } catch (error) {
      throw new HttpException(
        'Failed to test Telegram connection',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('test/websocket')
  @ApiOperation({ summary: 'Get WebSocket connection status' })
  @ApiResponse({ status: 200, description: 'WebSocket status' })
  getWebSocketStatus() {
    return {
      status: 'success',
      message: 'WebSocket gateway is running',
      connectedClients: this.meetingGateway['connectedClients'].size,
    };
  }

  @Get('scheduler/stats')
  @ApiOperation({ summary: 'Get scheduler statistics' })
  @ApiResponse({ status: 200, description: 'Scheduler statistics' })
  getSchedulerStats() {
    const stats = this.meetingScheduler.getSchedulerStats();
    return {
      status: 'success',
      data: stats,
    };
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming meetings in next 24 hours' })
  @ApiResponse({ status: 200, description: 'List of upcoming meetings' })
  getUpcomingMeetings() {
    const upcomingMeetings = this.meetingScheduler.getUpcomingMeetings();
    return {
      status: 'success',
      data: upcomingMeetings,
      count: upcomingMeetings.length,
    };
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all scheduled meetings' })
  @ApiResponse({ status: 200, description: 'List of all meetings' })
  getAllMeetings() {
    const allMeetings = this.meetingScheduler.getAllMeetings();
    return {
      status: 'success',
      data: allMeetings,
      count: allMeetings.length,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get meeting by ID' })
  @ApiParam({ name: 'id', description: 'Meeting ID' })
  @ApiResponse({ status: 200, description: 'Meeting details' })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  getMeeting(@Param('id') id: string) {
    const meeting = this.meetingScheduler.getMeeting(id);
    if (!meeting) {
      throw new HttpException('Meeting not found', HttpStatus.NOT_FOUND);
    }
    return {
      status: 'success',
      data: meeting,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new meeting with automatic scheduling' })
  @ApiResponse({ status: 201, description: 'Meeting created and scheduled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createMeeting(@Body() createMeetingDto: CreateMeetingDto) {
    try {
      const meeting: Meeting = {
        id: uuidv4(),
        title: createMeetingDto.title,
        description: createMeetingDto.description,
        startTime: new Date(createMeetingDto.startTime),
        endTime: new Date(createMeetingDto.endTime),
        participants: createMeetingDto.participants,
        location: createMeetingDto.location,
        createdBy: createMeetingDto.createdBy,
      };

      // Validate meeting times
      if (meeting.startTime >= meeting.endTime) {
        throw new HttpException(
          'Start time must be before end time',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (meeting.startTime < new Date()) {
        throw new HttpException(
          'Start time cannot be in the past',
          HttpStatus.BAD_REQUEST,
        );
      }

      const notification: MeetingNotification = {
        type: 'created',
        meeting,
        message: 'New meeting has been scheduled with automatic reminders'
      };

      // Send immediate creation notification to Telegram
      await this.telegramService.sendMeetingNotification(notification);
      
      // Broadcast via WebSocket
      this.meetingGateway.server.emit('meeting:created', notification);

      // Schedule automatic reminders and notifications
      await this.meetingScheduler.scheduleMeeting(meeting);

      return {
        status: 'success',
        message: 'Meeting created, scheduled, and notification sent',
        meeting: {
          id: meeting.id,
          title: meeting.title,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          status: meeting.status,
        },
        scheduledReminders: ['24h', '1h', '15min', '5min', 'starting', 'ended']
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to create meeting',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
}

}