import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CarbonCreditService {
  constructor(private prisma: PrismaService) {}

  async recordCredit(ownerId: number, tripId: number, co2SavedKg: number) {
    // Giả định 1 tín chỉ = 10 kg CO2
    const creditsEarned = co2SavedKg / 10;

    // Cập nhật ví carbon
    await this.prisma.carbonWallet.upsert({
      where: { ownerId },
      update: { balance: { increment: co2SavedKg } },
      create: { ownerId, balance: co2SavedKg },
    });

    // Ghi nhận lịch sử tín chỉ
    return this.prisma.carbonCredit.create({
      data: {
        ownerId,
        tripId,
        co2SavedKg,
        creditsEarned,
      },
    });
  }

  async getBalance(ownerId: number) {
    const total = await this.prisma.carbonCredit.aggregate({
      where: { ownerId },
      _sum: { creditsEarned: true },
    });
    return total._sum.creditsEarned ?? 0;
  }

  async getHistory(ownerId: number) {
    return this.prisma.carbonCredit.findMany({
      where: { ownerId },
      include: { trip: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
