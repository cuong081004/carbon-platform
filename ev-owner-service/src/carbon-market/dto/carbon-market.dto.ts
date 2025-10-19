import { IsNumber, Min, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateFixedListingDto {
  @IsNumber()
  @Min(0, { message: 'Amount must be greater than or equal to 0' })
  amount: number;

  @IsNumber()
  @Min(0, { message: 'Price per credit must be greater than or equal to 0' })
  pricePerCredit: number;
}

export class CreateAuctionDto {
  @IsNumber()
  @Min(0, { message: 'Amount must be greater than or equal to 0' })
  amount: number;

  @IsNumber()
  @Min(0, { message: 'Start price must be greater than or equal to 0' })
  startPrice: number;

  @IsNotEmpty()
  @IsDateString()
  endTime: string;
}
