import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { VehicleTripModule } from './vehicle-trip/vehicle-trip.module';
import { CarbonCreditModule } from './carbon-credit/carbon-credit.module';
import { CarbonWalletModule } from './carbon-wallet/carbon-wallet.module';
import { CarbonMarketModule } from './carbon-market/carbon-market.module';
import { ScheduleModule } from '@nestjs/schedule';
import { StatisticsModule } from './statistics/statistics.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    VehicleTripModule,
    AuthModule,
    UserModule,
    PrismaModule,
    CarbonCreditModule,
    CarbonWalletModule,
    CarbonMarketModule,
    ScheduleModule.forRoot(),
    StatisticsModule,
    DashboardModule,
  ],
})
export class AppModule {}
