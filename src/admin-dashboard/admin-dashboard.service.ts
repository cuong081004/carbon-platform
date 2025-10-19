import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminDashboardService {
  constructor(private prisma: PrismaService) {}

  async getSystemOverview() {
    const totalUsers = await this.prisma.user.count();
    const totalCredits = await this.prisma.carbonCredit.aggregate({
      _sum: { creditsEarned: true },
    });
    const totalListings = await this.prisma.carbonMarketListing.count();
    const totalWallets = await this.prisma.carbonWallet.count();
    const totalTransactions = await this.prisma.carbonWalletTransaction.count();

    return {
      totalUsers,
      totalCredits: totalCredits._sum.creditsEarned || 0,
      totalListings,
      totalWallets,
      totalTransactions,
    };
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async getUserDetails(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        carbonWallets: true,
        carbonCredits: true,
        carbonMarketListings: true,
      },
    });
  }

  async deleteUser(id: number) {
    await this.prisma.user.delete({ where: { id } });
    return { message: `User ${id} deleted.` };
  }
}
