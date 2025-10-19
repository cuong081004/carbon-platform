import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentService } from '../payment/payment.service';

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
    if (!wallet || wallet.balance < amount) {
      throw new BadRequestException('Không đủ tín chỉ carbon để niêm yết');
    }

    // trừ tạm tín chỉ khỏi ví
    await this.prisma.carbonWallet.update({
      where: { ownerId: sellerId },
      data: { balance: { decrement: amount } },
    });

    return this.prisma.carbonMarketListing.create({
      data: { sellerId, amount, pricePerCredit, type: 'FIXED' },
    });
  }

  async buyListing(buyerId: number, listingId: number) {
    const listing = await this.prisma.carbonMarketListing.findUnique({
      where: { id: listingId },
    });

    if (!listing || listing.status !== 'OPEN') {
      throw new Error('Listing not found or not available for purchase');
    }

    const totalPrice = listing.amount * listing.pricePerCredit;

    const buyerWallet = await this.prisma.carbonWallet.findUnique({
      where: { ownerId: buyerId },
    });

    // Nếu buyer chưa có ví thì tạo ví trống
    const buyerBalance = buyerWallet?.balanceFiat || 0;

    if (buyerBalance >= totalPrice) {
      // ✅ Đủ tiền — giao dịch ngay
      await this.prisma.$transaction([
        // Trừ tiền buyer
        this.prisma.carbonWallet.update({
          where: { ownerId: buyerId },
          data: { balanceFiat: { decrement: totalPrice } },
        }),

        // Cộng tiền seller
        this.prisma.carbonWallet.upsert({
          where: { ownerId: listing.sellerId },
          update: { balanceFiat: { increment: totalPrice } },
          create: { ownerId: listing.sellerId, balanceFiat: totalPrice },
        }),

        // Buyer nhận tín chỉ carbon
        this.prisma.carbonWallet.upsert({
          where: { ownerId: buyerId },
          update: { balanceCarbon: { increment: listing.amount } },
          create: { ownerId: buyerId, balanceCarbon: listing.amount },
        }),

        // Cập nhật listing sang SOLD
        this.prisma.carbonMarketListing.update({
          where: { id: listingId },
          data: { status: 'SOLD', buyerId },
        }),
      ]);

      return { message: '✅ Purchase completed successfully.' };
    } else {
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
    if (!wallet || wallet.balance < amount) {
      throw new BadRequestException('Không đủ tín chỉ carbon để mở đấu giá');
    }

    // Trừ tạm tín chỉ
    await this.prisma.carbonWallet.update({
      where: { ownerId: sellerId },
      data: { balance: { decrement: amount } },
    });

    return this.prisma.carbonMarketListing.create({
      data: {
        sellerId,
        amount,
        pricePerCredit: startPrice,
        type: 'AUCTION',
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

    // Kiểm tra endTime, xử lý nếu null
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
        data: { balance: { increment: auction.amount } },
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
      update: { balance: { increment: auction.amount } },
      create: { ownerId: highestBid.bidderId, balance: auction.amount },
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
      // Tìm bid cao nhất
      const topBid = await this.prisma.bid.findFirst({
        where: { auctionId: auction.id },
        orderBy: { bidAmount: 'desc' },
      });

      if (topBid) {
        // Cập nhật winner + đóng auction
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
        // Không có bid → hủy đấu giá
        await this.prisma.carbonMarketListing.update({
          where: { id: auction.id },
          data: { status: 'CANCELLED' },
        });
        this.logger.log(`⚠️ Đấu giá #${auction.id} không có ai tham gia → hủy`);
      }
    }
  }

  // 🔮 Hàm gợi ý giá dựa trên dữ liệu + xu hướng (ML giả lập)
  async suggestPricePerCredit(userId: number) {
    // 1️⃣ Lấy dữ liệu giao dịch gần đây
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

    // 2️⃣ Chuyển dữ liệu sang mảng [x, y]
    // x là index thời gian (0, 1, 2, ...), y là giá
    const x = history.map((_, i) => i);
    const y = history.map((h) => h.pricePerCredit);

    // 3️⃣ Tính Linear Regression (giả lập)
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
    const sumXX = x.reduce((a, b) => a + b * b, 0);

    // y = a*x + b
    const a = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const b = (sumY - a * sumX) / n;

    // 4️⃣ Dự đoán giá “ngày hôm nay”
    const predicted = a * n + b; // tiếp theo sau dữ liệu hiện có

    // 5️⃣ Trung bình thực tế
    const avgMarket = sumY / n;

    // 6️⃣ Dữ liệu CO₂ của user để điều chỉnh
    const userCredits = await this.prisma.carbonCredit.findMany({
      where: { ownerId: userId },
      select: { co2SavedKg: true },
    });

    const avgUserCo2 =
      userCredits.length > 0
        ? userCredits.reduce((sum, c) => sum + c.co2SavedKg, 0) /
          userCredits.length
        : 10;

    // 7️⃣ Áp dụng điều chỉnh AI + CO₂
    let suggested = predicted * (avgUserCo2 / 10);

    // Giới hạn để tránh outlier
    if (suggested < 5) suggested = 5;
    if (suggested > 100) suggested = 100;

    // 8️⃣ Tính xu hướng
    const trend =
      a > 0 ? '📈 Giá thị trường đang tăng' : '📉 Giá thị trường đang giảm';

    // 💾 Lưu lịch sử gợi ý
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
}
