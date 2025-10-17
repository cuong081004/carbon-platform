import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleTripDto } from './dto/create-vehicle-trip.dto';

@Injectable()
export class VehicleTripService {
  constructor(private prisma: PrismaService) {}

  async createTrip(ownerId: number, dto: CreateVehicleTripDto) {
    // Nếu client không gửi co2SavedKg, tính theo công thức rule-based
    // (vd: baseline 0.12 kg CO2 saved per km; bạn điều chỉnh tham số theo nhu cầu)
    const co2SavedKg =
      dto.co2SavedKg !== undefined && dto.co2SavedKg !== null
        ? dto.co2SavedKg
        : this.calculateCo2Saved(dto.distanceKm, dto.energyUsedKWh);

    const trip = await this.prisma.vehicleTrip.create({
      data: {
        ownerId,
        startLocation: dto.startLocation,
        endLocation: dto.endLocation,
        distanceKm: dto.distanceKm,
        energyUsedKWh: dto.energyUsedKWh,
        co2SavedKg,
      },
    });

    return trip;
  }

  async findAllByOwner(ownerId: number) {
    return this.prisma.vehicleTrip.findMany({
      where: { ownerId },
      orderBy: { date: 'desc' },
    });
  }

  calculateCo2Saved(distanceKm: number, energyUsedKWh: number): number {
    // ví dụ rule-based:
    // baseline_g_per_km (xăng/diesel) = 0.18 kg/km => 180 g/km => 0.18 kg/km
    // actual_emission = grid_g_per_kWh * energyUsedKWh (chuyển g->kg)
    // đơn giản ở đây ta dùng approximation: saved = distanceKm * 0.12
    // bạn có thể thay bằng công thức phức tạp hơn
    const approxSavedKg = distanceKm * 0.12;
    return Math.max(0, approxSavedKg);
  }
}
