import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Req,
  UseGuards,
  ValidationPipe,
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

  @Get('listings')
  @ApiOperation({ summary: 'Get all open carbon listings' })
  async getOpenListings() {
    return this.marketService.getOpenListings();
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
}
