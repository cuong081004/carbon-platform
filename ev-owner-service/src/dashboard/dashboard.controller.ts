import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('dashboard')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview/:userId')
  async getOverview(@Param('userId') userId: string) {
    return this.dashboardService.getOverview(+userId);
  }

  @Get('ai-trends/:userId')
  async getAiTrends(@Param('userId') userId: string) {
    return this.dashboardService.getAiTrend(+userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('summary')
  async getSummary(@Request() req) {
    const ownerId = req.user.id;
    return this.dashboardService.getSummary(ownerId);
  }
}
