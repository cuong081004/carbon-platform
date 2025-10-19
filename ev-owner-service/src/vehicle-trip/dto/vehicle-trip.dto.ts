import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateTripDto {
  @IsNotEmpty()
  @IsNumber()
  ownerId: number;

  @IsNotEmpty()
  @IsString()
  startLocation: string;

  @IsNotEmpty()
  @IsString()
  endLocation: string;

  @IsNotEmpty()
  @IsNumber()
  distanceKm: number;

  @IsNotEmpty()
  @IsNumber()
  energyUsedKWh: number;
}