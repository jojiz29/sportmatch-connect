import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SportsService } from './sports.service';

@ApiTags('Sports')
@Controller('sports')
export class SportsController {
  constructor(private sportsService: SportsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all sports catalog' })
  async findAll() {
    return this.sportsService.findAll();
  }
}