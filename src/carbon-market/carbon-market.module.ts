import { Module } from '@nestjs/common';
import { CarbonMarketService } from './carbon-market.service';
import { CarbonMarketController } from './carbon-market.controller';

@Module({
  providers: [CarbonMarketService],
  controllers: [CarbonMarketController]
})
export class CarbonMarketModule {}
