import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CarbonMarketService {
  constructor(private prisma: PrismaService) {}

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

  // 💰 Mua tín chỉ
  async buyListing(buyerId: number, listingId: number) {
    const listing = await this.prisma.carbonMarketListing.findUnique({
      where: { id: listingId },
    });
    if (!listing || listing.status !== 'OPEN') {
      throw new BadRequestException('Listing không tồn tại hoặc đã bán');
    }

    // Chuyển tín chỉ cho buyer
    await this.prisma.carbonWallet.upsert({
      where: { ownerId: buyerId },
      update: { balance: { increment: listing.amount } },
      create: { ownerId: buyerId, balance: listing.amount },
    });

    // Cập nhật trạng thái listing
    await this.prisma.carbonMarketListing.update({
      where: { id: listingId },
      data: { status: 'SOLD' },
    });

    return { message: 'Mua thành công', listingId };
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
}
