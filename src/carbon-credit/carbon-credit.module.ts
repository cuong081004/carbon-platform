import { Module } from '@nestjs/common';
import { CarbonCreditService } from './carbon-credit.service';
import { CarbonCreditController } from './carbon-credit.controller';

@Module({
  providers: [CarbonCreditService],
  controllers: [CarbonCreditController],
  exports: [CarbonCreditService],
})
export class CarbonCreditModule {}
