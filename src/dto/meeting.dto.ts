import { IsString, IsArray, IsOptional, IsDateString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';


export class CreateMeetingDto {
  @ApiProperty({ example: 'Weekly Team Standup' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Regular team sync meeting', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2024-12-15T10:00:00Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2024-12-15T11:00:00Z' })
  @IsDateString()
  endTime: string;

  @ApiProperty({ example: ['john@example.com', 'jane@example.com'] })
  @IsArray()
  @IsString({ each: true })
  participants: string[];

  @ApiProperty({ example: 'Conference Room A', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: 'admin@example.com' })
  @IsString()
  createdBy: string;
}

export class UpdateMeetingDto extends CreateMeetingDto {
  @ApiProperty({ example: 'meeting-123' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'Time and location updated' })
  @IsString()
  changes: string;
}

export class CancelMeetingDto {
  @ApiProperty({ example: 'meeting-123' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'Weekly Team Standup' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Regular team sync meeting', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2024-12-15T10:00:00Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2024-12-15T11:00:00Z' })
  @IsDateString()
  endTime: string;

  @ApiProperty({ example: ['john@example.com', 'jane@example.com'] })
  @IsArray()
  @IsString({ each: true })
  participants: string[];

  @ApiProperty({ example: 'Conference Room A', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: 'admin@example.com' })
  @IsString()
  createdBy: string;

  @ApiProperty({ example: 'Cancelled due to scheduling conflict', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}