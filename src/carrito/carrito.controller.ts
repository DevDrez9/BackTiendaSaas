import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CarritoService } from './carrito.service';
import { CreateCarritoDto } from './dto/create-carrito.dto';
import { UpdateCarritoDto } from './dto/update-carrito.dto';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from 'src/common/rol.enum';


@Controller('carrito')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CarritoController {
  constructor(private readonly carritosService: CarritoService) {}

  @Post()
  @Roles(Rol.ADMIN, Rol.MANAGER, Rol.USER)
  create(@Body() createCarritoDto: CreateCarritoDto) {
    return this.carritosService.create(createCarritoDto);
  }

  @Get()
  @Roles(Rol.ADMIN, Rol.MANAGER)
  findAll() {
    return this.carritosService.findAll();
  }

  @Get(':id')
  @Roles(Rol.ADMIN, Rol.MANAGER, Rol.USER)
  findOne(@Param('id') id: string) {
    return this.carritosService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Rol.ADMIN, Rol.MANAGER, Rol.USER)
  update(@Param('id') id: string, @Body() updateCarritoDto: UpdateCarritoDto) {
    return this.carritosService.update(+id, updateCarritoDto);
  }

  @Delete(':id')
  @Roles(Rol.ADMIN, Rol.MANAGER)
  remove(@Param('id') id: string) {
    return this.carritosService.remove(+id);
  }

  @Post(':id/items')
  @Roles(Rol.ADMIN, Rol.MANAGER, Rol.USER)
  addItem(@Param('id') id: string, @Body() addItemDto: AddItemDto) {
    return this.carritosService.addItem(+id, addItemDto);
  }

  @Patch(':carritoId/items/:itemId')
  @Roles(Rol.ADMIN, Rol.MANAGER, Rol.USER)
  updateItem(
    @Param('carritoId') carritoId: string,
    @Param('itemId') itemId: string,
    @Body() updateItemDto: UpdateItemDto,
  ) {
    return this.carritosService.updateItem(+carritoId, +itemId, updateItemDto);
  }

  @Delete(':carritoId/items/:itemId')
  @Roles(Rol.ADMIN, Rol.MANAGER, Rol.USER)
  removeItem(
    @Param('carritoId') carritoId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.carritosService.removeItem(+carritoId, +itemId);
  }

  @Delete(':id/clear')
  @Roles(Rol.ADMIN, Rol.MANAGER, Rol.USER)
  clearCart(@Param('id') id: string) {
    return this.carritosService.clearCart(+id);
  }

  @Get('tienda/:tiendaId')
  @Roles(Rol.ADMIN, Rol.MANAGER)
  getByTienda(@Param('tiendaId') tiendaId: string) {
    return this.carritosService.getCarritosByTienda(+tiendaId);
  }

  @Post(':id/convert-to-venta')
  @Roles(Rol.ADMIN, Rol.MANAGER, Rol.USER)
  convertToVenta(@Param('id') id: string) {
    return this.carritosService.convertToVenta(+id);
  }
}
