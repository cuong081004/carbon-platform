import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secret123',
    });
  }

  // payload chứa những gì bạn sign vào token (ví dụ { id, email, username })
  async validate(payload: any) {
    // nếu token chỉ có email, ta fetch user từ DB
    const user = await this.prisma.user.findUnique({
      where: { email: payload.email },
      select: { id: true, email: true, username: true, role: true },
    });
    // trả về object sẽ gắn vào req.user
    return user; // { id, email, username } hoặc null (Nest sẽ block nếu null/undefined)
  }
}
