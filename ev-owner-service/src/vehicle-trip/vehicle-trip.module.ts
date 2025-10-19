import { Module } from '@nestjs/common';
import { VehicleTripController } from './vehicle-trip.controller';
import { VehicleTripService } from './vehicle-trip.service';
import { PrismaModule } from '../prisma/prisma.module'; // Import để inject PrismaService
import { CarbonCreditModule } from '../carbon-credit/carbon-credit.module';

@Module({
  imports: [PrismaModule, CarbonCreditModule], // Cần để sử dụng PrismaService
  controllers: [VehicleTripController], // Đăng ký controller
  providers: [VehicleTripService], // Đăng ký service
})
export class VehicleTripModule {}
