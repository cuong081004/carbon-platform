import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CarbonMarketService } from './carbon-market.service';
import { CarbonMarketController } from './carbon-market.controller';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [PaymentModule],
  controllers: [CarbonMarketController],
  providers: [CarbonMarketService, PrismaService],
})
export class CarbonMarketModule {}
