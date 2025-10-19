import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  // Tổng quan hệ thống
  async getOverview(userId: number) {
    const [totalTrips, totalCo2, totalCredits, totalRevenue] =
      await Promise.all([
        this.prisma.vehicleTrip.count({ where: { ownerId: userId } }),
        this.prisma.vehicleTrip.aggregate({
          _sum: { co2SavedKg: true },
          where: { ownerId: userId },
        }),
        this.prisma.carbonCredit.count({ where: { ownerId: userId } }),
        this.prisma.carbonMarketListing.aggregate({
          _sum: { pricePerCredit: true },
          where: { sellerId: userId, status: 'SOLD' },
        }),
      ]);

    return {
      totalTrips,
      totalCo2SavedKg: totalCo2._sum.co2SavedKg || 0,
      totalCarbonCredits: totalCredits,
      totalRevenueUsd: totalRevenue._sum.pricePerCredit || 0,
    };
  }

  // Dữ liệu AI gợi ý gần đây
  async getAiTrend(userId: number) {
    return this.prisma.priceSuggestionHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        createdAt: true,
        suggestedPrice: true,
        trend: true,
      },
    });
  }

  async getSummary(ownerId: number) {
    const trips = await this.prisma.vehicleTrip.findMany({
      where: { ownerId },
      include: { carbonCredits: true },
    });

    const totalCO2 = trips.reduce((sum, t) => sum + (t.co2SavedKg || 0), 0);
    const totalCredits = trips.reduce(
      (sum, t) => sum + (t.carbonCredits?.[0]?.creditsEarned || 0),
      0,
    );

    // tổng doanh thu = tổng creditsEarned * giá bán trung bình (giả lập)
    const averagePricePerCredit = 25; // USD/credit (giả lập)
    const totalRevenue = totalCredits * averagePricePerCredit;

    return {
      totalCO2,
      totalCredits,
      totalRevenue,
    };
  }
}
