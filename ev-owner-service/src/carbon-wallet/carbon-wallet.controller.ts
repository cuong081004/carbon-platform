import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CarbonWalletService } from './carbon-wallet.service';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import {
  DepositDto,
  BuyCarbonDto,
  SellCarbonDto,
} from './dto/carbon-wallet.dto';

@Controller('carbon-wallet')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class CarbonWalletController {
  constructor(private walletService: CarbonWalletService) {}

  @Get()
  @ApiOperation({ summary: 'Get user wallet' })
  async getWallet(@Req() req) {
    return this.walletService.getWallet(req.user.id);
  }

  @Post('deposit')
  @ApiOperation({ summary: 'Deposit fiat money into wallet' })
  @ApiBody({ type: DepositDto })
  async deposit(
    @Req() req,
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    body: DepositDto,
  ) {
    return this.walletService.deposit(req.user.id, body.amount);
  }

  @Post('buy')
  @ApiOperation({ summary: 'Buy carbon credits' })
  @ApiBody({ type: BuyCarbonDto })
  async buyCarbon(
    @Req() req,
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    body: BuyCarbonDto,
  ) {
    return this.walletService.buyCarbon(
      req.user.id,
      body.amountCarbon,
      body.pricePerCredit,
    );
  }

  @Post('sell')
  @ApiOperation({ summary: 'Sell carbon credits' })
  @ApiBody({ type: SellCarbonDto })
  async sellCarbon(
    @Req() req,
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    body: SellCarbonDto,
  ) {
    return this.walletService.sellCarbon(
      req.user.id,
      body.amountCarbon,
      body.pricePerCredit,
    );
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get transaction history for wallet' })
  async getTransactions(@Req() req) {
    return this.walletService.getTransactions(req.user.id);
  }
}
