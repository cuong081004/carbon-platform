import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class UserService {
  [x: string]: any;
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        username: createUserDto.username,
        email: createUserDto.email,
        password: hashedPassword,
        role: createUserDto.role || 'USER',
      },
    });

    return { message: 'User registered', user };
  }

  async login(loginUserDto: LoginUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginUserDto.email },
    });

    if (!user) return { message: 'User not found' };

    const isMatch = await bcrypt.compare(loginUserDto.password, user.password);
    if (!isMatch) return { message: 'Invalid credentials' };

    const token = this.jwtService.sign({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });
    return { access_token: token };
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }
}
