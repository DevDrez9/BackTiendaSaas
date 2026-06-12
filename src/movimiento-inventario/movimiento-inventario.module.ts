import { Module } from '@nestjs/common';
import { MovimientoInventarioService } from './movimiento-inventario.service';
import { MovimientoInventarioController } from './movimiento-inventario.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [MovimientoInventarioController],
  providers: [MovimientoInventarioService,PrismaService],
   exports: [MovimientoInventarioService],
})
export class MovimientoInventarioModule {}
