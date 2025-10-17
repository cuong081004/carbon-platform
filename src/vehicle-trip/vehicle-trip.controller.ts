import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Query,
} from '@nestjs/common';
import { VehicleTripService } from './vehicle-trip.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CreateVehicleTripDto } from './dto/create-vehicle-trip.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('VehicleTrip')
@Controller('vehicle-trip')
@ApiBearerAuth('JWT-auth')
export class VehicleTripController {
  constructor(private readonly vehicleTripService: VehicleTripService) {}

  // Bảo vệ route bằng JWT
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  async createTrip(@Request() req, @Body() dto: CreateVehicleTripDto) {
    // req.user được tạo bởi JwtStrategy.validate() — nên có id, email
    const ownerId = req.user?.id;
    if (!ownerId) {
      // an toàn: nếu không tìm thấy id, trả lỗi 401/403 (Nest sẽ handle)
      throw new Error('User not found in token');
    }
    return this.vehicleTripService.createTrip(ownerId, dto);
  }

  // Lấy trips của owner hiện tại (bảo vệ)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  async getMyTrips(@Request() req) {
    const ownerId = req.user.id;
    return this.vehicleTripService.findAllByOwner(ownerId);
  }

  // (tuỳ chọn) lấy theo query param ownerId (admin)
  @Get('by-owner')
  getTrips(@Query('ownerId') ownerId: string) {
    return this.vehicleTripService.findAllByOwner(Number(ownerId));
  }
}
