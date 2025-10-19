import { Module } from '@nestjs/common';
import { CarbonWalletService } from './carbon-wallet.service';
import { CarbonWalletController } from './carbon-wallet.controller';

@Module({
  providers: [CarbonWalletService],
  controllers: [CarbonWalletController]
})
export class CarbonWalletModule {}
