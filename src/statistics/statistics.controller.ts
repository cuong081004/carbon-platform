import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('statistics')
@ApiBearerAuth('JWT-auth')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('global')
  async getGlobalStats() {
    return this.statisticsService.getGlobalStats();
  }

  @UseGuards(JwtAuthGuard)
  @Get('monthly')
  async getUserMonthlyStats(@Req() req) {
    const userId = req.user.userId;
    return this.statisticsService.getUserMonthlyStats(userId);
  }
}
