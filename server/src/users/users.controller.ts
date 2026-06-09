import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users (for matchmaking)' })
  async findAll(@Query('excludeUserId') excludeUserId?: string) {
    return this.usersService.findAll(excludeUserId);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get leaderboard' })
  async getLeaderboard() {
    return this.usersService.getLeaderboard();
  }
}