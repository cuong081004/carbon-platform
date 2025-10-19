import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Delete,
  Param,
} from '@nestjs/common';
import { VehicleTripService } from './vehicle-trip.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CreateVehicleTripDto } from './dto/create-vehicle-trip.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('VehicleTrip')
@Controller('vehicle-trip')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class VehicleTripController {
  constructor(private readonly vehicleTripService: VehicleTripService) {}

  /** 🟢 Tạo hành trình mới */
  @Post()
  async createTrip(@Request() req, @Body() dto: CreateVehicleTripDto) {
    const ownerId = req.user?.id;
    if (!ownerId) {
      throw new Error('Không xác định được chủ sở hữu từ token');
    }
    return this.vehicleTripService.createTrip(ownerId, dto);
  }

  /** 🟢 Lấy tất cả hành trình của user đăng nhập */
  @Get('by-owner')
  async getMyTrips(@Request() req) {
    const ownerId = req.user?.id;
    if (!ownerId) {
      throw new Error('Không xác định được user từ token');
    }
    return this.vehicleTripService.findAllByOwner(ownerId);
  }

  /** 🗑️ Xoá hành trình của user hiện tại */
  @Delete(':id')
  async deleteTrip(@Request() req, @Param('id') id: string) {
    const ownerId = req.user?.id;
    return this.vehicleTripService.deleteTrip(ownerId, Number(id));
  }
}
