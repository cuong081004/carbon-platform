import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({ isGlobal: true }), // Tải .env toàn cục; đặt isGlobal: true để dùng khắp app
    JwtModule.registerAsync({
      imports: [ConfigModule], // Đảm bảo ConfigService có sẵn
      useFactory: (configService: ConfigService) => ({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        secret:
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          configService.get<string>('JWT_SECRET') || 'default_secret_fallback', // Lấy kiểu an toàn với fallback
        signOptions: {
          // Sử dụng literal hợp lệ (khớp StringValue) hoặc parse sang number
          // Nếu env là chuỗi như '1d', sẽ kiểm tra runtime; để an toàn compile-time, dùng as const hoặc validation
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1d') as
            | '1d'
            | '60s'
            | number, // Thu hẹp kiểu union (thêm literal khác nếu cần)
          // Thay thế: Parse sang number nếu dùng giây: parseInt(configService.get<string>('JWT_EXPIRES_IN'), 10) || 86400, // 1 ngày = 86400 giây
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
