import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';

import { CreateMovimientoInventarioDto } from './dto/create-movimiento-inventario.dto';
import { FilterMovimientosDto } from './dto/filter-movimientos.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MovimientoInventarioService } from './movimiento-inventario.service';
import { Rol } from 'src/common/rol.enum';


@Controller('movimientos-inventario')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MovimientoInventarioController {
   constructor(private readonly movimientosService: MovimientoInventarioService) {}

  @Post()
  @Roles(Rol.ADMIN, Rol.MANAGER)
  create(@Body() createMovimientoDto: CreateMovimientoInventarioDto) {
    return this.movimientosService.create(createMovimientoDto);
  }

  @Get()
  @Roles(Rol.ADMIN, Rol.MANAGER)
  findAll(@Query() filterMovimientosDto: FilterMovimientosDto) {
    return this.movimientosService.findAll(filterMovimientosDto);
  }

  @Get(':id')
  @Roles(Rol.ADMIN, Rol.MANAGER)
  findOne(@Param('id') id: string) {
    return this.movimientosService.findOne(+id);
  }

  @Get('producto/:productoId')
  @Roles(Rol.ADMIN, Rol.MANAGER)
  findByProducto(
    @Param('productoId') productoId: string,
    @Query() filterMovimientosDto: FilterMovimientosDto,
  ) {
    return this.movimientosService.findByProducto(+productoId, filterMovimientosDto);
  }

  @Get('producto/:productoId/historial')
  @Roles(Rol.ADMIN, Rol.MANAGER)
  getStockHistory(
    @Param('productoId') productoId: string,
    @Query('dias') dias?: string,
  ) {
    return this.movimientosService.getStockHistory(+productoId, dias ? +dias : 30);
  }

  @Get('usuario/:usuarioId')
  @Roles(Rol.ADMIN, Rol.MANAGER)
  getByUsuario(
    @Param('usuarioId') usuarioId: string,
    @Query() filterMovimientosDto: FilterMovimientosDto,
  ) {
    return this.movimientosService.getMovimientosByUsuario(+usuarioId, filterMovimientosDto);
  }

  @Get('compra/:compraId')
  @Roles(Rol.ADMIN, Rol.MANAGER)
  getByCompra(@Param('compraId') compraId: string) {
    return this.movimientosService.getMovimientosByCompra(+compraId);
  }

  @Get('venta/:ventaId')
  @Roles(Rol.ADMIN, Rol.MANAGER)
  getByVenta(@Param('ventaId') ventaId: string) {
    return this.movimientosService.getMovimientosByVenta(+ventaId);
  }

  @Get('resumen/totales')
  @Roles(Rol.ADMIN, Rol.MANAGER)
  getResumenMovimientos(
    @Query('productoId') productoId?: string,
    @Query('dias') dias?: string,
  ) {
    return this.movimientosService.getResumenMovimientos(
      productoId ? +productoId : undefined,
      dias ? +dias : 30,
    );
  }

  @Get('alertas/stock-bajo')
  @Roles(Rol.ADMIN, Rol.MANAGER)
  getProductosBajoStock(@Query('minimo') minimo?: string) {
    return this.movimientosService.getProductosBajoStock(minimo ? +minimo : 5);
  }
}
