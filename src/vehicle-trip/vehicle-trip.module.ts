import { Module } from '@nestjs/common';
import { VehicleTripController } from './vehicle-trip.controller';
import { VehicleTripService } from './vehicle-trip.service';
import { PrismaModule } from '../prisma/prisma.module'; // Import để inject PrismaService

@Module({
  imports: [PrismaModule], // Cần để sử dụng PrismaService
  controllers: [VehicleTripController], // Đăng ký controller
  providers: [VehicleTripService], // Đăng ký service
})
export class VehicleTripModule {}
