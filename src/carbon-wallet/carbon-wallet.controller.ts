import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CarbonWalletService } from './carbon-wallet.service';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('carbon-wallet')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class CarbonWalletController {
  constructor(private walletService: CarbonWalletService) {}

  @Get()
  async getWallet(@Req() req) {
    const ownerId = req.user.id;
    const wallet = await this.walletService.getWallet(ownerId);
    return {
      ownerId,
      balance: wallet.balance,
      lastUpdated: wallet.updatedAt,
    };
  }
}
