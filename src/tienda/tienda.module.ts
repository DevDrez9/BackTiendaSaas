import { Module } from '@nestjs/common';
import { TiendaService } from './tienda.service';
import { TiendaController } from './tienda.controller';
import { PrismaService } from 'src/prisma.service';
import { DominioService } from './dominio.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [TiendaController],
  providers: [TiendaService, PrismaService, DominioService],
  exports: [TiendaService, DominioService],
})
export class TiendaModule {}
