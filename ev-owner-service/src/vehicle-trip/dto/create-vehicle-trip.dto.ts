import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateVehicleTripDto {
  @IsString()
  startLocation: string;

  @IsString()
  endLocation: string;

  @IsNumber()
  @Min(0)
  distanceKm: number;

  @IsNumber()
  @Min(0)
  energyUsedKWh: number;

  // co2SavedKg optional — server sẽ tính nếu client không gửi
  @IsOptional()
  @IsNumber()
  @Min(0)
  co2SavedKg?: number;
}
