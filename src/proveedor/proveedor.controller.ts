import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ProveedorService } from './proveedor.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Rol } from 'src/common/rol.enum';
import { AssignTiendaDto } from './dto/assign-tienda.dto';
import { CreateCompraDto } from './dto/create-compra.dto';
import { EstadoCompra } from 'src/common/estado-compra.enum';

@Controller('proveedor')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProveedorController {
   constructor(private readonly proveedoresService: ProveedorService) {}

  // PROVEEDORES

  @Post()
  @Roles(Rol.ADMIN, Rol.MANAGER)
  create(@Body() createProveedorDto: CreateProveedorDto) {
    return this.proveedoresService.create(createProveedorDto);
  }

  @Get()
  @Roles(Rol.ADMIN, Rol.MANAGER)
  findAll() {
    return this.proveedoresService.findAll();
  }

  @Get(':id')
  @Roles(Rol.ADMIN, Rol.MANAGER)
  findOne(@Param('id') id: string) {
    return this.proveedoresService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Rol.ADMIN, Rol.MANAGER)
  update(@Param('id') id: string, @Body() updateProveedorDto: UpdateProveedorDto) {
    return this.proveedoresService.update(+id, updateProveedorDto);
  }

  @Delete(':id')
  @Roles(Rol.ADMIN)
  remove(@Param('id') id: string) {
    return this.proveedoresService.remove(+id);
  }

  @Post(':id/tiendas')
  @Roles(Rol.ADMIN, Rol.MANAGER)
  assignTienda(@Param('id') id: string, @Body() assignTiendaDto: AssignTiendaDto) {
    return this.proveedoresService.assignTienda(+id, assignTiendaDto);
  }

  @Delete(':proveedorId/tiendas/:tiendaId')
  @Roles(Rol.ADMIN, Rol.MANAGER)
  removeTienda(@Param('proveedorId') proveedorId: string, @Param('tiendaId') tiendaId: string) {
    return this.proveedoresService.removeTienda(+proveedorId, +tiendaId);
  }

  @Get(':id/tiendas')
  @Roles(Rol.ADMIN, Rol.MANAGER)
  getProveedorTiendas(@Param('id') id: string) {
    return this.proveedoresService.getProveedorTiendas(+id);
  }

  // COMPRAS

  @Post('compras')
  @Roles(Rol.ADMIN, Rol.MANAGER)
  createCompra(@Body() createCompraDto: CreateCompraDto) {
    return this.proveedoresService.createCompra(createCompraDto);
  }

  @Get('compras/all')
  @Roles(Rol.ADMIN, Rol.MANAGER)
  findAllCompras(@Query('proveedorId') proveedorId?: string) {
    return this.proveedoresService.findAllCompras(proveedorId ? +proveedorId : undefined);
  }

  @Get('compras/:id')
  @Roles(Rol.ADMIN, Rol.MANAGER)
  findOneCompra(@Param('id') id: string) {
    return this.proveedoresService.findOneCompra(+id);
  }

  @Patch('compras/:id/estado')
  @Roles(Rol.ADMIN, Rol.MANAGER)
  updateEstadoCompra(@Param('id') id: string, @Body('estado') estado: EstadoCompra) {
    return this.proveedoresService.updateEstadoCompra(+id, estado);
  }
}
