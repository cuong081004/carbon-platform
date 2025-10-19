import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  // Tổng quan toàn hệ thống
  async getGlobalStats() {
    const totalTrips = await this.prisma.vehicleTrip.count();
    const totalCo2 = await this.prisma.vehicleTrip.aggregate({
      _sum: { co2SavedKg: true },
    });
    const totalCredits = await this.prisma.carbonCredit.count();

    return {
      totalTrips,
      totalCo2SavedKg: totalCo2._sum.co2SavedKg || 0,
      totalCredits,
    };
  }

  // Thống kê theo tháng (của 1 user cụ thể)
  async getUserMonthlyStats(userId: number) {
    const trips = await this.prisma.vehicleTrip.groupBy({
      by: ['date'],
      where: { ownerId: userId },
      _sum: { co2SavedKg: true, distanceKm: true },
    });

    // Gom theo tháng (chuyển date → tháng-năm)
    const monthly = trips.reduce((acc, trip) => {
      const month = new Date(trip.date).toISOString().slice(0, 7); // yyyy-MM
      if (!acc[month]) acc[month] = { co2: 0, distance: 0 };
      acc[month].co2 += trip._sum.co2SavedKg || 0;
      acc[month].distance += trip._sum.distanceKm || 0;
      return acc;
    }, {} as Record<string, { co2: number; distance: number }>);

    return monthly;
  }
}
