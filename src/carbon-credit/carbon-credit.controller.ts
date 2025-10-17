import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CarbonCreditService } from './carbon-credit.service';

@ApiTags('carbon-credit')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('carbon-credit')
export class CarbonCreditController {
  constructor(private readonly carbonCreditService: CarbonCreditService) {}

  @Get('balance')
  async getBalance(@Req() req) {
    const ownerId = req.user.id;
    const balance = await this.carbonCreditService.getBalance(ownerId);
    return { ownerId, balance };
  }

  @Get('history')
  async getHistory(@Req() req) {
    const ownerId = req.user.id;
    return this.carbonCreditService.getHistory(ownerId);
  }
}
