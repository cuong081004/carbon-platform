import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { Roles } from 'src/auth/roles/roles.decorator';
import { RolesGuard } from 'src/auth/roles/roles.guard';

@ApiTags('User')
@Controller('user')
@ApiBearerAuth('JWT-auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.userService.register(createUserDto);
  }

  @Post('login')
  login(@Body() loginUserDto: LoginUserDto) {
    return this.userService.login(loginUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return { message: 'This is your profile', user: req.user };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('all')
  getAllUsers() {
    return this.userService.findAll();
  }
}
