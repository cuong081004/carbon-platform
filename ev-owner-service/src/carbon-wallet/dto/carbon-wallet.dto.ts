// dto/carbon-wallet.dto.ts
import { IsNumber, Min } from 'class-validator';

export class DepositDto {
  @IsNumber()
  @Min(0, { message: 'Số tiền nạp phải lớn hơn 0' })
  amount: number;
}

export class BuyCarbonDto {
  @IsNumber()
  @Min(0, { message: 'Số tín chỉ carbon phải lớn hơn 0' })
  amountCarbon: number;

  @IsNumber()
  @Min(0, { message: 'Giá mỗi tín chỉ phải lớn hơn 0' })
  pricePerCredit: number;
}

export class SellCarbonDto {
  @IsNumber()
  @Min(0, { message: 'Số tín chỉ carbon phải lớn hơn 0' })
  amountCarbon: number;

  @IsNumber()
  @Min(0, { message: 'Giá mỗi tín chỉ phải lớn hơn 0' })
  pricePerCredit: number;
}