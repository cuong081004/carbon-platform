import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Tạo payment intent (mock)
   * Trả về object mô phỏng payment gateway response: externalId, amount, status
   */
  async createPaymentIntent(
    userId: number,
    amountFiat: number,
    metadata?: any,
  ) {
    const externalId = `pi_${uuidv4()}`;

    const pi = await this.prisma.paymentIntent.create({
      data: {
        externalId,
        userId,
        amountFiat,
        metadata,
        status: 'PENDING',
      },
    });

    // return info to client so client can "simulate" redirect
    return {
      id: pi.id,
      externalId: pi.externalId,
      amountFiat: pi.amountFiat,
      status: pi.status,
      // here we provide a mock "checkout_url" for testing — caller can "simulate" checkout
      checkoutUrl: `/payments/mock-checkout/${pi.externalId}`,
    };
  }

  /**
   * Called by our system (or a scheduler) to simulate gateway sending webhook on success.
   * In real life this would be an external webhook endpoint.
   */
  async handleWebhook(externalId: string, status: 'SUCCEEDED' | 'FAILED') {
    const pi = await this.prisma.paymentIntent.findUnique({
      where: { externalId },
    });
    if (!pi) throw new Error('PaymentIntent not found');

    if (pi.status === status) {
      this.logger.log(`PaymentIntent ${externalId} already ${status}`);
      return pi;
    }

    const updated = await this.prisma.paymentIntent.update({
      where: { externalId },
      data: { status },
    });

    const meta = (pi.metadata as any) || {};

    // ✅ Nếu là DEPOSIT
    if (status === 'SUCCEEDED' && meta.type === 'DEPOSIT') {
      const wallet = await this.prisma.carbonWallet.upsert({
        where: { ownerId: pi.userId },
        update: { balanceFiat: { increment: pi.amountFiat } },
        create: { ownerId: pi.userId, balanceFiat: pi.amountFiat },
      });

      await this.prisma.carbonWalletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'DEPOSIT',
          amountFiat: pi.amountFiat,
          description: `Deposit via payment intent ${externalId}`,
        },
      });

      this.logger.log(`Wallet of user ${pi.userId} credited $${pi.amountFiat}`);
    }

    // ✅ Nếu là BUY — hoàn tất giao dịch
    if (status === 'SUCCEEDED' && meta.type === 'BUY' && meta.listingId) {
      this.logger.log(
        `PaymentIntent ${externalId} succeeded for listing ${meta.listingId}`,
      );

      const listing = await this.prisma.carbonMarketListing.findUnique({
        where: { id: meta.listingId },
      });

      if (listing && listing.status === 'OPEN') {
        const totalPrice = listing.amount * listing.pricePerCredit;

        // Kiểm tra và tạo ví cho người bán và người mua nếu cần
        const sellerWallet = await this.prisma.carbonWallet.upsert({
          where: { ownerId: listing.sellerId },
          update: {},
          create: {
            ownerId: listing.sellerId,
            balanceFiat: 0,
            balanceCarbon: 0,
          },
        });

        const buyerWallet = await this.prisma.carbonWallet.upsert({
          where: { ownerId: pi.userId },
          update: {},
          create: { ownerId: pi.userId, balanceFiat: 0, balanceCarbon: 0 },
        });

        await this.prisma.$transaction([
          // Cộng tiền cho người bán
          this.prisma.carbonWallet.upsert({
            where: { ownerId: listing.sellerId },
            update: { balanceFiat: { increment: totalPrice } },
            create: { ownerId: listing.sellerId, balanceFiat: totalPrice },
          }),

          // Buyer nhận tín chỉ carbon
          this.prisma.carbonWallet.upsert({
            where: { ownerId: pi.userId },
            update: { balanceCarbon: { increment: listing.amount } },
            create: { ownerId: pi.userId, balanceCarbon: listing.amount },
          }),

          // Đánh dấu listing đã bán
          this.prisma.carbonMarketListing.update({
            where: { id: meta.listingId },
            data: { status: 'SOLD', buyerId: pi.userId },
          }),

          // Ghi log giao dịch
          this.prisma.carbonWalletTransaction.createMany({
            data: [
              {
                walletId: sellerWallet.id,
                type: 'SELL_CARBON',
                amountFiat: totalPrice,
                amountCarbon: -listing.amount,
                description: `Sold ${listing.amount} carbon credits to user ${pi.userId}`,
              },
              {
                walletId: buyerWallet.id,
                type: 'BUY_CARBON',
                amountFiat: -totalPrice,
                amountCarbon: listing.amount,
                description: `Bought ${listing.amount} carbon credits from user ${listing.sellerId}`,
              },
            ],
          }),
        ]);

        this.logger.log(
          `✅ Listing ${meta.listingId} successfully sold after payment webhook`,
        );
      }
    }

    return updated;
  }

  // Utility: get payment intent status
  async getPaymentIntent(externalId: string) {
    return this.prisma.paymentIntent.findUnique({ where: { externalId } });
  }

  // For convenience: simulate immediate success (testing)
  async simulateSuccess(externalId: string) {
    return this.handleWebhook(externalId, 'SUCCEEDED');
  }
}
