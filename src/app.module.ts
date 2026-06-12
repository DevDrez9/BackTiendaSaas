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

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    TiendaModule, CategoriaModule, ProductoModule, ConfigWebModule, UsuarioModule,AuthModule, ProveedorModule, VentaModule, CarritoModule, MovimientoInventarioModule, PlanModule, UploadModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
