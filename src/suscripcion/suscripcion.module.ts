import { Module } from '@nestjs/common';
import { SuscripcionService } from './suscripcion.service';
import { SuscripcionController } from './suscripcion.controller';
import { HttpModule } from '@nestjs/axios';
import { PrismaService } from 'src/prisma.service';
import { TiendaModule } from 'src/tienda/tienda.module';
import { PlanModule } from 'src/plan/plan.module';
import { PagoVerificadorService } from './pago-verificador.service';
import { AvisosVencimientoService } from './avisos-vencimiento.service';

@Module({
  imports: [HttpModule, TiendaModule, PlanModule],
  controllers: [SuscripcionController],
  providers: [SuscripcionService, PrismaService, PagoVerificadorService, AvisosVencimientoService]
})
export class SuscripcionModule {}
