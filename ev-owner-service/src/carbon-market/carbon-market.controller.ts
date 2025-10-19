import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Req,
  UseGuards,
  ValidationPipe,
  Request,
} from '@nestjs/common';
import { CarbonMarketService } from './carbon-market.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import {
  CreateFixedListingDto,
  CreateAuctionDto,
} from './dto/carbon-market.dto'; // Cập nhật import

@Controller('carbon-market')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class CarbonMarketController {
  constructor(private marketService: CarbonMarketService) {}

  @Post('fixed')
  @ApiOperation({ summary: 'Create a fixed-price carbon listing' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          example: 5,
          description: 'Số tín chỉ carbon rao bán',
        },
        pricePerCredit: {
          type: 'number',
          example: 12.5,
          description: 'Giá mỗi tín chỉ carbon',
        },
      },
      required: ['amount', 'pricePerCredit'],
    },
  })
  async createFixedListing(
    @Req() req,
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    dto: CreateFixedListingDto,
  ) {
    const sellerId = req.user.id;
    return this.marketService.createFixedListing(
      sellerId,
      dto.amount,
      dto.pricePerCredit,
    );
  }

  @Post('buy/:id')
  @ApiOperation({ summary: 'Buy a carbon listing by ID' })
  async buyListing(@Req() req, @Param('id') id: string) {
    const buyerId = req.user.id;
    return this.marketService.buyListing(buyerId, Number(id));
  }

  @Post('listing')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo niêm yết tín chỉ carbon dạng cố định (FIXED)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', example: 10 },
        pricePerCredit: { type: 'number', example: 12.5 },
      },
      required: ['amount', 'pricePerCredit'],
    },
  })
  async createListing(@Request() req, @Body() dto: CreateFixedListingDto) {
    const sellerId = req.user.id;
    return this.marketService.createListing(sellerId, dto);
  }

  @Post('auction')
  @ApiOperation({ summary: 'Create a new auction listing' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          example: 10,
          description: 'Số tín chỉ carbon rao bán',
        },
        startPrice: {
          type: 'number',
          example: 10.0,
          description: 'Giá khởi điểm của auction',
        },
        endTime: {
          type: 'string',
          example: '2025-10-25T12:00:00Z',
          description: 'Thời gian kết thúc auction (ISO format)',
        },
      },
      required: ['amount', 'startPrice', 'endTime'],
    },
  })
  async createAuction(
    @Req() req,
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    dto: CreateAuctionDto,
  ) {
    const sellerId = req.user.id;
    return this.marketService.createAuctionListing(
      sellerId,
      dto.amount,
      dto.startPrice,
      new Date(dto.endTime),
    );
  }

  @Post('bid/:auctionId')
  @ApiOperation({ summary: 'Place a bid on an auction' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        bidAmount: {
          type: 'number',
          example: 15.0,
          description: 'Số tiền đặt thầu',
        },
      },
      required: ['bidAmount'],
    },
  })
  async placeBid(
    @Req() req,
    @Param('auctionId') id: string,
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    dto: { bidAmount: number },
  ) {
    const bidderId = req.user.id;
    return this.marketService.placeBid(bidderId, Number(id), dto.bidAmount);
  }

  @Post('close/:auctionId')
  @ApiOperation({ summary: 'Close an auction and determine winner' })
  async closeAuction(@Param('auctionId') id: string) {
    return this.marketService.closeAuction(Number(id));
  }

  @UseGuards(JwtAuthGuard)
  @Get('suggest-price')
  async suggestPrice(@Req() req) {
    const userId = req.user.id;
    return this.marketService.suggestPricePerCredit(userId);
  }

  @Get('suggestion-history/:userId')
  async getHistory(@Param('userId') userId: string) {
    return this.marketService.getSuggestionHistory(Number(userId));
  }

  @Get('my-listings')
  @ApiOperation({ summary: 'Lấy danh sách niêm yết của người dùng hiện tại' })
  async getMyListings(@Req() req) {
    const userId = req.user.id;
    return this.marketService.getListingsByUser(userId);
  }

  @Get('open-listings')
  @ApiOperation({ summary: 'Lấy danh sách tất cả các niêm yết đang mở để mua' })
  async getOpenListings() {
    return this.marketService.getOpenListings();
  }

  // 💰 Lấy lịch sử giao dịch ví của người dùng
  @Get('my-wallet-transactions')
  @ApiOperation({
    summary: 'Lấy lịch sử giao dịch ví Carbon của người dùng hiện tại',
  })
  async getMyWalletTransactions(@Req() req) {
    const userId = req.user.id;
    return this.marketService.getWalletTransactions(userId);
  }

  // 📊 Lấy thống kê tổng quan ví (số dư & số giao dịch)
  @Get('my-wallet-summary')
  @ApiOperation({ summary: 'Lấy tổng quan ví carbon của người dùng hiện tại' })
  async getMyWalletSummary(@Req() req) {
    const userId = req.user.id;
    return this.marketService.getWalletSummary(userId);
  }

  // 💰 Nạp tiền vào ví (giả lập)
  @Post('deposit')
  @ApiOperation({ summary: 'Nạp tiền vào ví Carbon (mock)' })
  async deposit(@Req() req, @Body() body: { amount: number }) {
    const userId = req.user.id;
    return this.marketService.depositToWallet(userId, body.amount);
  }

  // 💸 Rút tiền ra ví (giả lập)
  @Post('withdraw')
  @ApiOperation({ summary: 'Rút tiền khỏi ví Carbon (mock)' })
  async withdraw(@Req() req, @Body() body: { amount: number }) {
    const userId = req.user.id;
    return this.marketService.withdrawFromWallet(userId, body.amount);
  }
}
