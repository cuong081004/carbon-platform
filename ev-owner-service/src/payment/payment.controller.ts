import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
  Get,
  Logger,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { CreatePaymentIntentDto, WebhookDto } from './dto/payment.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private paymentService: PaymentService) {}

  // 1. User tạo payment intent để nạp tiền
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('create-intent')
  @ApiOperation({ summary: 'Create a payment intent for deposit' })
  @ApiBody({ type: CreatePaymentIntentDto })
  async createIntent(
    @Req() req,
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    body: CreatePaymentIntentDto,
  ) {
    const userId = req.user.id;
    const meta = { type: 'DEPOSIT' };
    return this.paymentService.createPaymentIntent(
      userId,
      body.amountFiat,
      meta,
    );
  }

  // 2. Mock "checkout" URL (just for local manual testing)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('mock-checkout/:externalId')
  @ApiOperation({ summary: 'Mock checkout URL for testing payment intent' })
  async mockCheckout(@Param('externalId') externalId: string) {
    return {
      message:
        'This is a mock checkout page. To simulate success POST to /payments/webhook',
      externalId,
      simulateWebhookEndpoint: `/payments/webhook/${externalId}?status=SUCCEEDED`,
    };
  }

  // 3. Webhook endpoint — external gateway calls this
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('webhook/:externalId')
  @ApiOperation({ summary: 'Webhook to handle payment status updates' })
  @ApiBody({ type: WebhookDto })
  async webhook(
    @Param('externalId') externalId: string,
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    body: WebhookDto,
  ) {
    const status = (body?.status as 'SUCCEEDED' | 'FAILED') || 'SUCCEEDED';
    this.logger.log(`Received webhook for ${externalId} -> ${status}`);
    const updated = await this.paymentService.handleWebhook(
      externalId,
      status as any,
    );
    return { ok: true, updated };
  }

  // 4. Check intent status
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('status/:externalId')
  @ApiOperation({ summary: 'Check status of a payment intent' })
  async status(@Param('externalId') externalId: string) {
    return this.paymentService.getPaymentIntent(externalId);
  }
}
