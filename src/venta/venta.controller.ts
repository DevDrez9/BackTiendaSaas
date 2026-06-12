import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { VentaService } from './venta.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { UpdateVentaDto } from './dto/update-venta.dto';
import { FilterVentasDto } from './dto/filter-ventas.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from 'src/common/rol.enum';
import { EstadoVenta } from 'src/common/estado-venta.enum';


@Controller('venta')
export class VentaController {
  constructor(private readonly ventasService: VentaService) {}

  @Post()
  create(@Body() createVentaDto: CreateVentaDto) {
    // This is now fully public so customers can place orders without an account
    return this.ventasService.create(createVentaDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN, Rol.MANAGER)
  findAll(@Query() filterVentasDto: FilterVentasDto) {
    return this.ventasService.findAll(filterVentasDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN, Rol.MANAGER)
  findOne(@Param('id') id: string) {
    return this.ventasService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN, Rol.MANAGER)
  update(@Param('id') id: string, @Body() updateVentaDto: UpdateVentaDto) {
    return this.ventasService.update(+id, updateVentaDto);
  }

  @Patch(':id/estado')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN, Rol.MANAGER)
  updateEstado(@Param('id') id: string, @Body('estado') estado: EstadoVenta) {
    return this.ventasService.updateEstado(+id, estado);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN, Rol.MANAGER)
  remove(@Param('id') id: string) {
    return this.ventasService.remove(+id);
  }

  @Get('tienda/:tiendaId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN, Rol.MANAGER, Rol.USER)
  getByTienda(@Param('tiendaId') tiendaId: string, @Query() filterVentasDto: FilterVentasDto) {
    return this.ventasService.getVentasByTienda(+tiendaId, filterVentasDto);
  }

  @Get('estadisticas/totales')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMIN, Rol.MANAGER)
  getEstadisticas(@Query('tiendaId') tiendaId?: string) {
    return this.ventasService.getEstadisticas(tiendaId ? +tiendaId : undefined);
  }
}
