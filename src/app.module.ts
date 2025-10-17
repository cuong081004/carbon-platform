import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { VehicleTripModule } from './vehicle-trip/vehicle-trip.module';

@Module({
  imports: [VehicleTripModule, AuthModule, UserModule, PrismaModule],
})
export class AppModule {}
