import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // 👈 Cái này giúp PrismaService dùng được ở mọi module
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
