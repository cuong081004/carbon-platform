import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PassportModule, JwtModule.register({}), PrismaModule],
  providers: [JwtStrategy],
  exports: [JwtStrategy],
})
export class AuthModule {}
