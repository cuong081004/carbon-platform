import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType } from '@prisma/client';

@Injectable()
export class CarbonWalletService {
  constructor(private prisma: PrismaService) {}

  // Lấy ví (tự tạo nếu chưa có)
  async getWallet(ownerId: number) {
    let wallet = await this.prisma.carbonWallet.findUnique({
      where: { ownerId },
    });
    if (!wallet) {
      wallet = await this.prisma.carbonWallet.create({
        data: { ownerId, balanceFiat: 0, balanceCarbon: 0 },
      });
    }
    return wallet;
  }

  // Nạp tiền
  async deposit(ownerId: number, amount: number) {
    if (amount <= 0) throw new BadRequestException('Invalid deposit amount');

    const wallet = await this.getWallet(ownerId);
    const updated = await this.prisma.carbonWallet.update({
      where: { id: wallet.id },
      data: { balanceFiat: { increment: amount } },
    });

    await this.prisma.carbonWalletTransaction.create({
      data: {
        walletId: wallet.id,
        type: TransactionType.DEPOSIT,
        amountFiat: amount,
        description: `Deposit of ${amount}`,
      },
    });

    return updated;
  }

  // Mua tín chỉ carbon
  async buyCarbon(
    ownerId: number,
    amountCarbon: number,
    pricePerCredit: number,
  ) {
    const wallet = await this.getWallet(ownerId);
    const totalCost = amountCarbon * pricePerCredit;

    if (wallet.balanceFiat < totalCost)
      throw new BadRequestException('Insufficient fiat balance');

    const updated = await this.prisma.carbonWallet.update({
      where: { id: wallet.id },
      data: {
        balanceFiat: { decrement: totalCost },
        balanceCarbon: { increment: amountCarbon },
      },
    });

    await this.prisma.carbonWalletTransaction.create({
      data: {
        walletId: wallet.id,
        type: TransactionType.BUY_CARBON,
        amountFiat: -totalCost,
        amountCarbon: amountCarbon,
        description: `Bought ${amountCarbon} carbon credits at ${pricePerCredit}/credit`,
      },
    });

    return updated;
  }

  // Bán tín chỉ carbon
  async sellCarbon(
    ownerId: number,
    amountCarbon: number,
    pricePerCredit: number,
  ) {
    const wallet = await this.getWallet(ownerId);
    if (wallet.balanceCarbon < amountCarbon)
      throw new BadRequestException('Not enough carbon credits');

    const totalEarned = amountCarbon * pricePerCredit;

    const updated = await this.prisma.carbonWallet.update({
      where: { id: wallet.id },
      data: {
        balanceCarbon: { decrement: amountCarbon },
        balanceFiat: { increment: totalEarned },
      },
    });

    await this.prisma.carbonWalletTransaction.create({
      data: {
        walletId: wallet.id,
        type: TransactionType.SELL_CARBON,
        amountFiat: totalEarned,
        amountCarbon: -amountCarbon,
        description: `Sold ${amountCarbon} credits for ${totalEarned}`,
      },
    });

    return updated;
  }

  // Lịch sử giao dịch
  async getTransactions(ownerId: number) {
    const wallet = await this.getWallet(ownerId);
    return this.prisma.carbonWalletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
    });
  }
}
