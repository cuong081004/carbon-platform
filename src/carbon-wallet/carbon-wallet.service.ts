import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CarbonWalletService {
  constructor(private prisma: PrismaService) {}

  async getWallet(ownerId: number) {
    let wallet = await this.prisma.carbonWallet.findUnique({
      where: { ownerId },
    });

    if (!wallet) {
      wallet = await this.prisma.carbonWallet.create({
        data: { ownerId, balance: 0 },
      });
    }

    return wallet;
  }

  async addCredits(ownerId: number, amount: number) {
    return this.prisma.carbonWallet.update({
      where: { ownerId },
      data: { balance: { increment: amount } },
    });
  }

  async subtractCredits(ownerId: number, amount: number) {
    return this.prisma.carbonWallet.update({
      where: { ownerId },
      data: { balance: { decrement: amount } },
    });
  }
}
