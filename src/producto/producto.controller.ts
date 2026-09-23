import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { ProductoService } from './producto.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { FiltrosProductoDto } from './dto/filtros-producto.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Rol } from 'src/common/rol.enum';
import { SinSuscripcion } from 'src/common/decorators/sin-suscripcion.decorator';
import { FilterProductosDto } from './dto/filter-productos.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { ResourceOwnershipGuard } from 'src/common/guards/resource-ownership.guard';

// Convierte los query params (strings) a number/boolean según FilterProductosDto
const queryPipe = new ValidationPipe({ transform: true, whitelist: true });

@Controller('producto')
export class ProductoController {
  constructor(private readonly productosService: ProductoService) {}

  @UseGuards(JwtAuthGuard, RolesGuard, ResourceOwnershipGuard)
  @Post()
  @Roles(Rol.ADMIN, Rol.MANAGER, Rol.USER)
  create(@Body() createProductoDto: CreateProductoDto) {
    return this.productosService.create(createProductoDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  @Roles(Rol.ADMIN, Rol.MANAGER, Rol.USER)
  findAll(@Query(queryPipe) filterProductosDto: FilterProductosDto) {
    return this.productosService.findAll(filterProductosDto);
  }

  @SinSuscripcion()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productosService.findOnePublico(+id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, ResourceOwnershipGuard)
  @Patch(':id')
  @Roles(Rol.ADMIN, Rol.MANAGER, Rol.USER)
  update(@Param('id') id: string, @Body() updateProductoDto: UpdateProductoDto) {
    return this.productosService.update(+id, updateProductoDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, ResourceOwnershipGuard)
  @Delete(':id')
  @Roles(Rol.ADMIN, Rol.MANAGER, Rol.USER)
  remove(@Param('id') id: string) {
    return this.productosService.remove(+id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, ResourceOwnershipGuard)
  @Patch(':id/stock')
  @Roles(Rol.ADMIN, Rol.MANAGER, Rol.USER)
  updateStock(@Param('id') id: string, @Body() updateStockDto: UpdateStockDto) {
    return this.productosService.updateStock(+id, updateStockDto);
  }

  @SinSuscripcion()
  @Get('tienda/:tiendaId')
  // Public endpoint
  getByTienda(@Param('tiendaId') tiendaId: string, @Query(queryPipe) filterProductosDto: FilterProductosDto) {
    return this.productosService.getProductosByTienda(+tiendaId, filterProductosDto);
  }

  @SinSuscripcion()
  @Get('categoria/:categoriaId')
  // Public endpoint
  getByCategoria(@Param('categoriaId') categoriaId: string, @Query(queryPipe) filterProductosDto: FilterProductosDto) {
    return this.productosService.getProductosByCategoria(+categoriaId, filterProductosDto);
  }

  @SinSuscripcion()
  @Get('subcategoria/:subcategoriaId')
  // Public endpoint
  getBySubcategoria(@Param('subcategoriaId') subcategoriaId: string, @Query(queryPipe) filterProductosDto: FilterProductosDto) {
    return this.productosService.getProductosBySubcategoria(+subcategoriaId, filterProductosDto);
  }

  @SinSuscripcion()
  @Get('tienda/:tiendaId/destacados')
  // Public endpoint
  getDestacados(@Param('tiendaId') tiendaId: string, @Query('limit') limit?: string) {
    return this.productosService.getProductosDestacados(+tiendaId, limit ? +limit : 10);
  }

  @SinSuscripcion()
  @Get('tienda/:tiendaId/oferta')
  // Public endpoint
  getOferta(@Param('tiendaId') tiendaId: string, @Query('limit') limit?: string) {
    return this.productosService.getProductosOferta(+tiendaId, limit ? +limit : 10);
  }

  @SinSuscripcion()
  @Get('tienda/:tiendaId/nuevos')
  // Public endpoint
  getNuevos(@Param('tiendaId') tiendaId: string, @Query('limit') limit?: string) {
    return this.productosService.getProductosNuevos(+tiendaId, limit ? +limit : 10);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, ResourceOwnershipGuard)
  @Post(':id/imagenes')
  @Roles(Rol.ADMIN, Rol.MANAGER, Rol.USER)
  addImagen(@Param('id') id: string, @Body() imagenData: any) {
    return this.productosService.addImagen(+id, imagenData);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, ResourceOwnershipGuard)
  @Delete('imagenes/:imagenId')
  @Roles(Rol.ADMIN, Rol.MANAGER, Rol.USER)
  removeImagen(@Param('imagenId') imagenId: string) {
    return this.productosService.removeImagen(+imagenId);
  }
}
