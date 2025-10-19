import { IsNumber, IsString, IsEnum, Min } from 'class-validator';

export class CreatePaymentIntentDto {
  @IsNumber()
  @Min(0, { message: 'Số tiền nạp phải lớn hơn 0' })
  amountFiat: number;
}

export class WebhookDto {
  @IsString()
  @IsEnum(['SUCCEEDED', 'FAILED'], {
    message: 'Trạng thái phải là SUCCEEDED hoặc FAILED',
  })
  status?: string;
}
