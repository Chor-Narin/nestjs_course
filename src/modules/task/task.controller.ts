import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { dto } from './dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly taskService: TaskService) {}


  @Post()
  async createTask(@Body() createTaskDto: dto) {
      return this.taskService.createTask(createTaskDto);
  }

}


