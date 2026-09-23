import { PrismaService } from './prisma.service';
import { MailModule } from './mail/mail.module';
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TiendaModule } from './tienda/tienda.module';
import { CategoriaModule } from './categoria/categoria.module';
import { ProductoModule } from './producto/producto.module';
import { ConfigWebModule } from './config-web/config-web.module';
import { UsuarioModule } from './usuario/usuario.module';
import { AuthModule } from './auth/auth.module';
import { ProveedorModule } from './proveedor/proveedor.module';
import { VentaModule } from './venta/venta.module';
import { CarritoModule } from './carrito/carrito.module';
import { MovimientoInventarioModule } from './movimiento-inventario/movimiento-inventario.module';
import { PlanModule } from './plan/plan.module';
import { UploadModule } from './upload/upload.module';

import { ScheduleModule } from '@nestjs/schedule';

import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { SuscripcionModule } from './suscripcion/suscripcion.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100, // global limit: 100 requests per minute
    }]),
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: process.env.UPLOADS_DIR || join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    TiendaModule, CategoriaModule, ProductoModule, ConfigWebModule, UsuarioModule,AuthModule, ProveedorModule, VentaModule, CarritoModule, MovimientoInventarioModule, PlanModule, UploadModule, SuscripcionModule, MailModule],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ],
})
export class AppModule {}
