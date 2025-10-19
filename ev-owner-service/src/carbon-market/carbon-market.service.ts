import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentService } from '../payment/payment.service';
import { CreateFixedListingDto } from './dto/carbon-market.dto';

@Injectable()
export class CarbonMarketService {
  private readonly logger = new Logger(CarbonMarketService.name);

  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService,
  ) {}

  // 🏷️ Niêm yết fixed-price
  async createFixedListing(
    sellerId: number,
    amount: number,
    pricePerCredit: number,
  ) {
    const wallet = await this.prisma.carbonWallet.findUnique({
      where: { ownerId: sellerId },
    });

    if (!wallet || wallet.balanceCarbon < amount) {
      throw new BadRequestException('❌ Không đủ tín chỉ carbon để niêm yết.');
    }

    // Trừ tạm tín chỉ khỏi ví khi niêm yết
    await this.prisma.carbonWallet.update({
      where: { ownerId: sellerId },
      data: { balanceCarbon: { decrement: amount } },
    });

    // Ghi log giao dịch niêm yết
    await this.prisma.carbonWalletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'SELL_CARBON',
        amountCarbon: -amount,
        description: `Niêm yết ${amount} tín chỉ carbon với giá ${pricePerCredit}/credit`,
      },
    });

    return this.prisma.carbonMarketListing.create({
      data: { sellerId, amount, pricePerCredit, type: 'FIXED', status: 'OPEN' },
    });
  }

  // ✅ Hàm niêm yết chuẩn (API /listing)
  async createListing(sellerId: number, dto: CreateFixedListingDto) {
    const { amount, pricePerCredit } = dto;
    const wallet = await this.prisma.carbonWallet.findUnique({
      where: { ownerId: sellerId },
    });

    if (!wallet || wallet.balanceCarbon < amount) {
      throw new BadRequestException('❌ Không đủ tín chỉ carbon để niêm yết.');
    }

    // Trừ tạm tín chỉ khỏi ví
    await this.prisma.carbonWallet.update({
      where: { ownerId: sellerId },
      data: { balanceCarbon: { decrement: amount } },
    });

    // Ghi log
    await this.prisma.carbonWalletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'SELL_CARBON',
        amountCarbon: -amount,
        description: `Niêm yết ${amount} tín chỉ carbon với giá ${pricePerCredit}/credit`,
      },
    });

    return this.prisma.carbonMarketListing.create({
      data: {
        sellerId,
        amount,
        pricePerCredit,
        type: 'FIXED',
        status: 'OPEN',
      },
    });
  }

  // 🛒 Mua niêm yết cố định
  async buyListing(buyerId: number, listingId: number) {
    const listing = await this.prisma.carbonMarketListing.findUnique({
      where: { id: listingId },
    });

    if (!listing || listing.status !== 'OPEN') {
      throw new Error('Listing not found or not available for purchase');
    }

    const totalPrice = listing.amount * listing.pricePerCredit;

    // Lấy hoặc tạo ví Buyer
    let buyerWallet = await this.prisma.carbonWallet.findUnique({
      where: { ownerId: buyerId },
    });
    if (!buyerWallet) {
      buyerWallet = await this.prisma.carbonWallet.create({
        data: { ownerId: buyerId },
      });
    }

    // Lấy hoặc tạo ví Seller
    let sellerWallet = await this.prisma.carbonWallet.findUnique({
      where: { ownerId: listing.sellerId },
    });
    if (!sellerWallet) {
      sellerWallet = await this.prisma.carbonWallet.create({
        data: { ownerId: listing.sellerId },
      });
    }

    const buyerBalance = buyerWallet?.balanceFiat || 0;

    if (buyerBalance < totalPrice) {
      // ❌ Không đủ tiền — tạo PaymentIntent để thanh toán sau
      const pi = await this.paymentService.createPaymentIntent(
        buyerId,
        totalPrice,
        { type: 'BUY', listingId },
      );

      return {
        message: '💳 Insufficient funds. Payment required.',
        requiresPayment: true,
        paymentIntent: pi,
      };
    }

    // ✅ Giao dịch hoàn chỉnh trong transaction
    await this.prisma.$transaction([
      // Buyer: trừ tiền, cộng carbon
      this.prisma.carbonWallet.update({
        where: { ownerId: buyerId },
        data: {
          balanceFiat: { decrement: totalPrice },
          balanceCarbon: { increment: listing.amount },
        },
      }),

      // Seller: cộng tiền (USD)
      this.prisma.carbonWallet.update({
        where: { ownerId: listing.sellerId },
        data: {
          balanceFiat: { increment: totalPrice },
        },
      }),

      // Cập nhật listing sang SOLD
      this.prisma.carbonMarketListing.update({
        where: { id: listingId },
        data: { status: 'SOLD', buyerId },
      }),

      // 🧾 Ghi transaction log cho seller
      this.prisma.carbonWalletTransaction.create({
        data: {
          walletId: sellerWallet.id,
          type: 'SELL_CARBON',
          amountFiat: totalPrice,
          amountCarbon: -listing.amount,
          description: `Bán ${listing.amount} tín chỉ carbon cho buyer #${buyerId}`,
        },
      }),

      // 🧾 Ghi transaction log cho buyer
      this.prisma.carbonWalletTransaction.create({
        data: {
          walletId: buyerWallet.id,
          type: 'BUY_CARBON',
          amountFiat: -totalPrice,
          amountCarbon: listing.amount,
          description: `Mua ${listing.amount} tín chỉ carbon từ seller #${listing.sellerId}`,
        },
      }),
    ]);

    return { message: '✅ Purchase completed successfully.' };
  }

  // 📋 Lấy danh sách listing đang mở
  async getOpenListings() {
    return this.prisma.carbonMarketListing.findMany({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 🕐 Tạo phiên đấu giá
  async createAuctionListing(
    sellerId: number,
    amount: number,
    startPrice: number,
    endTime: Date,
  ) {
    const wallet = await this.prisma.carbonWallet.findUnique({
      where: { ownerId: sellerId },
    });
    if (!wallet || wallet.balanceCarbon < amount) {
      throw new BadRequestException('Không đủ tín chỉ carbon để mở đấu giá');
    }

    // Trừ tạm tín chỉ
    await this.prisma.carbonWallet.update({
      where: { ownerId: sellerId },
      data: { balanceCarbon: { decrement: amount } },
    });

    return this.prisma.carbonMarketListing.create({
      data: {
        sellerId,
        amount,
        pricePerCredit: startPrice,
        type: 'AUCTION',
        status: 'OPEN',
        startTime: new Date(),
        endTime,
      },
    });
  }

  // 💸 Đặt giá thầu
  async placeBid(bidderId: number, auctionId: number, bidAmount: number) {
    const auction = await this.prisma.carbonMarketListing.findUnique({
      where: { id: auctionId },
      include: { bids: true },
    });

    if (!auction || auction.status !== 'OPEN') {
      throw new BadRequestException('Auction không hợp lệ hoặc đã kết thúc');
    }

    if (!auction.endTime) {
      throw new BadRequestException(
        'Auction không có thời gian kết thúc hợp lệ',
      );
    }

    if (new Date() > new Date(auction.endTime)) {
      throw new BadRequestException('Auction đã hết hạn');
    }

    const highestBid = auction.bids.length
      ? Math.max(...auction.bids.map((b) => b.bidAmount))
      : auction.pricePerCredit;

    if (bidAmount <= highestBid) {
      throw new BadRequestException(`Giá thầu phải cao hơn ${highestBid}`);
    }

    return this.prisma.bid.create({
      data: { auctionId, bidderId, bidAmount },
    });
  }

  // 🏁 Kết thúc đấu giá
  async closeAuction(auctionId: number) {
    const auction = await this.prisma.carbonMarketListing.findUnique({
      where: { id: auctionId },
      include: { bids: true },
    });

    if (!auction || auction.type !== 'AUCTION') {
      throw new BadRequestException('Auction không tồn tại');
    }

    if (auction.status !== 'OPEN') {
      throw new BadRequestException('Auction đã được đóng trước đó');
    }

    if (auction.bids.length === 0) {
      // Trả tín chỉ lại cho người bán
      await this.prisma.carbonWallet.update({
        where: { ownerId: auction.sellerId },
        data: { balanceCarbon: { increment: auction.amount } },
      });

      await this.prisma.carbonMarketListing.update({
        where: { id: auctionId },
        data: { status: 'CANCELLED' },
      });

      return {
        message: 'Không có ai đấu giá, tín chỉ được hoàn lại cho người bán',
      };
    }

    // Xác định người thắng
    const highestBid = auction.bids.reduce((prev, curr) =>
      prev.bidAmount > curr.bidAmount ? prev : curr,
    );

    await this.prisma.carbonWallet.upsert({
      where: { ownerId: highestBid.bidderId },
      update: { balanceCarbon: { increment: auction.amount } },
      create: { ownerId: highestBid.bidderId, balanceCarbon: auction.amount },
    });

    await this.prisma.carbonMarketListing.update({
      where: { id: auctionId },
      data: { status: 'SOLD' },
    });

    return {
      message: 'Đấu giá hoàn tất',
      winnerId: highestBid.bidderId,
      winningBid: highestBid.bidAmount,
    };
  }

  // 🕒 Cron job tự động đóng đấu giá hết hạn
  @Cron(CronExpression.EVERY_MINUTE)
  async autoCloseAuctions() {
    this.logger.log('⏰ Kiểm tra các phiên đấu giá hết hạn...');

    const expiredAuctions = await this.prisma.carbonMarketListing.findMany({
      where: {
        type: 'AUCTION',
        status: 'OPEN',
        endTime: { lt: new Date() },
      },
    });

    for (const auction of expiredAuctions) {
      const topBid = await this.prisma.bid.findFirst({
        where: { auctionId: auction.id },
        orderBy: { bidAmount: 'desc' },
      });

      if (topBid) {
        await this.prisma.carbonMarketListing.update({
          where: { id: auction.id },
          data: {
            status: 'SOLD',
            pricePerCredit: topBid.bidAmount,
            buyerId: topBid.bidderId,
          },
        });

        this.logger.log(
          `✅ Đấu giá #${auction.id} đã đóng — người thắng: ${topBid.bidderId}, giá: ${topBid.bidAmount}`,
        );
      } else {
        await this.prisma.carbonMarketListing.update({
          where: { id: auction.id },
          data: { status: 'CANCELLED' },
        });
        this.logger.log(`⚠️ Đấu giá #${auction.id} không có ai tham gia → hủy`);
      }
    }
  }

  // 🔮 Gợi ý giá
  async suggestPricePerCredit(userId: number) {
    const history = await this.prisma.carbonMarketListing.findMany({
      where: { status: 'SOLD' },
      take: 50,
      orderBy: { createdAt: 'asc' },
      select: { pricePerCredit: true, createdAt: true },
    });

    if (!history.length) {
      return {
        suggestedPrice: 10,
        reason: 'Thiếu dữ liệu thị trường, dùng giá mặc định 10.',
      };
    }

    const x = history.map((_, i) => i);
    const y = history.map((h) => h.pricePerCredit);
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
    const sumXX = x.reduce((a, b) => a + b * b, 0);
    const a = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const b = (sumY - a * sumX) / n;
    const predicted = a * n + b;
    const avgMarket = sumY / n;

    const userCredits = await this.prisma.carbonCredit.findMany({
      where: { ownerId: userId },
      select: { co2SavedKg: true },
    });

    const avgUserCo2 =
      userCredits.length > 0
        ? userCredits.reduce((sum, c) => sum + c.co2SavedKg, 0) /
          userCredits.length
        : 10;

    let suggested = predicted * (avgUserCo2 / 10);
    if (suggested < 5) suggested = 5;
    if (suggested > 100) suggested = 100;

    const trend =
      a > 0 ? '📈 Giá thị trường đang tăng' : '📉 Giá thị trường đang giảm';

    await this.prisma.priceSuggestionHistory.create({
      data: {
        userId,
        suggestedPrice: suggested,
        trend,
        avgMarket,
        avgUserCo2,
        slope: a,
      },
    });

    return {
      suggestedPrice: Number(suggested.toFixed(2)),
      trend,
      predictedNext: Number(predicted.toFixed(2)),
      avgMarket: Number(avgMarket.toFixed(2)),
      avgUserCo2: Number(avgUserCo2.toFixed(2)),
      slope: Number(a.toFixed(4)),
      reason:
        'AI giả lập (linear regression) dự đoán dựa trên xu hướng thị trường và hiệu suất CO₂ người dùng.',
    };
  }

  async getSuggestionHistory(userId: number) {
    return this.prisma.priceSuggestionHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async getListingsByUser(userId: number) {
    return this.prisma.carbonMarketListing.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 💳 Lấy lịch sử giao dịch ví Carbon của người dùng
  async getWalletTransactions(userId: number) {
    const wallet = await this.prisma.carbonWallet.findUnique({
      where: { ownerId: userId },
    });

    if (!wallet) {
      throw new BadRequestException('Người dùng chưa có ví Carbon');
    }

    return this.prisma.carbonWalletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 📈 Lấy thống kê tổng quan ví carbon
  async getWalletSummary(userId: number) {
    const wallet = await this.prisma.carbonWallet.findUnique({
      where: { ownerId: userId },
      include: { transactions: true },
    });

    if (!wallet) {
      throw new BadRequestException('Người dùng chưa có ví Carbon');
    }

    // Tổng tiền và tín chỉ hiện có
    const { balanceFiat, balanceCarbon } = wallet;

    // Số lượng giao dịch trong 30 ngày qua
    const now = new Date();
    const last30Days = new Date();
    last30Days.setDate(now.getDate() - 30);

    const recentTransactions = wallet.transactions.filter(
      (t) => new Date(t.createdAt) >= last30Days,
    );

    // Gom nhóm theo ngày để hiển thị biểu đồ
    const dailyCount: Record<string, number> = {};
    for (const tx of recentTransactions) {
      const day = new Date(tx.createdAt).toISOString().split('T')[0];
      dailyCount[day] = (dailyCount[day] || 0) + 1;
    }

    return {
      balanceFiat,
      balanceCarbon,
      totalTransactions: wallet.transactions.length,
      recentTransactionsCount: recentTransactions.length,
      dailyTransactionData: Object.entries(dailyCount).map(([date, count]) => ({
        date,
        count,
      })),
    };
  }

  // 💰 Nạp tiền (mock PaymentIntent)
  async depositToWallet(userId: number, amount: number) {
    if (amount <= 0) throw new BadRequestException('Số tiền nạp không hợp lệ');

    // Lấy hoặc tạo ví
    let wallet = await this.prisma.carbonWallet.findUnique({
      where: { ownerId: userId },
    });
    if (!wallet) {
      wallet = await this.prisma.carbonWallet.create({
        data: { ownerId: userId },
      });
    }

    // Ghi log PaymentIntent (mock)
    await this.prisma.paymentIntent.create({
      data: {
        externalId: `MOCK_DEP_${Date.now()}`,
        userId,
        amountFiat: amount,
        status: 'SUCCEEDED',
        metadata: { type: 'DEPOSIT' },
      },
    });

    // Cập nhật số dư
    const updatedWallet = await this.prisma.carbonWallet.update({
      where: { id: wallet.id },
      data: { balanceFiat: { increment: amount } },
    });

    // Ghi log giao dịch
    await this.prisma.carbonWalletTransaction.create({
      data: {
        walletId: updatedWallet.id,
        type: 'DEPOSIT',
        amountFiat: amount,
        description: `Nạp ${amount} USD vào ví`,
      },
    });

    return {
      message: '✅ Nạp tiền thành công',
      newBalance: updatedWallet.balanceFiat,
    };
  }

  // 💸 Rút tiền (mock PaymentIntent)
  async withdrawFromWallet(userId: number, amount: number) {
    if (amount <= 0) throw new BadRequestException('Số tiền rút không hợp lệ');

    const wallet = await this.prisma.carbonWallet.findUnique({
      where: { ownerId: userId },
    });

    if (!wallet || wallet.balanceFiat < amount) {
      throw new BadRequestException('Không đủ tiền để rút');
    }

    // Tạo PaymentIntent giả lập
    await this.prisma.paymentIntent.create({
      data: {
        externalId: `MOCK_WD_${Date.now()}`,
        userId,
        amountFiat: amount,
        status: 'SUCCEEDED',
        metadata: { type: 'WITHDRAW' },
      },
    });

    // Cập nhật ví
    const updatedWallet = await this.prisma.carbonWallet.update({
      where: { id: wallet.id },
      data: { balanceFiat: { decrement: amount } },
    });

    // Ghi log giao dịch
    await this.prisma.carbonWalletTransaction.create({
      data: {
        walletId: updatedWallet.id,
        type: 'WITHDRAW',
        amountFiat: -amount,
        description: `Rút ${amount} USD khỏi ví`,
      },
    });

    return {
      message: '✅ Rút tiền thành công',
      newBalance: updatedWallet.balanceFiat,
    };
  }
}
