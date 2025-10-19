import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleTripDto } from './dto/create-vehicle-trip.dto';
import { CarbonCreditService } from '../carbon-credit/carbon-credit.service';

@Injectable()
export class VehicleTripService {
  constructor(
    private prisma: PrismaService,
    private carbonCreditService: CarbonCreditService,
  ) {}

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
        co2SavedKg: co2SavedKg!,
        date: new Date(),
      },
    });

    // Ghi nhận tín chỉ carbon
    await this.carbonCreditService.recordCredit(ownerId, trip.id, co2SavedKg!);

    return trip;
  }

  async findAllByOwner(ownerId: number) {
    return this.prisma.vehicleTrip.findMany({
      where: { ownerId },
      include: {
        carbonCredits: {
          select: { creditsEarned: true },
        },
      },
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

  async deleteTrip(ownerId: number, tripId: number) {
    const trip = await this.prisma.vehicleTrip.findUnique({
      where: { id: tripId },
    });

    if (!trip || trip.ownerId !== ownerId) {
      throw new Error('Không tìm thấy hành trình hoặc không có quyền xoá');
    }

    // Xoá CarbonCredit nếu có
    await this.prisma.carbonCredit.deleteMany({
      where: { tripId: trip.id },
    });

    // Xoá hành trình
    await this.prisma.vehicleTrip.delete({
      where: { id: tripId },
    });

    return { message: 'Đã xoá hành trình thành công', tripId };
  }
}
