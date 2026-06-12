import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { CategoriaService } from './categoria.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Rol } from 'src/common/rol.enum';
import { CreateSubcategoriaDto } from './dto/create-subcategoria.dto';
import { UpdateSubcategoriaDto } from './dto/update-subcategoria.dto';

@Controller('categoria')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriaController {
  constructor(private readonly categoriaService: CategoriaService) {}

 
  // CATEGORIAS

  @Post()
  @Roles(Rol.ADMIN, Rol.MANAGER, Rol.USER)
  create(@Body() createCategoriaDto: CreateCategoriaDto) {
    return this.categoriaService.create(createCategoriaDto);
  }

  @Get()
  @Roles(Rol.ADMIN, Rol.MANAGER, Rol.USER)
  findAll(@Query('tiendaId') tiendaId?: string) {
    return this.categoriaService.findAll(tiendaId ? +tiendaId : undefined);
  }

  @Get(':id')
  @Roles(Rol.ADMIN, Rol.MANAGER, Rol.USER)
  findOne(@Param('id') id: string) {
    return this.categoriaService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Rol.ADMIN, Rol.MANAGER, Rol.USER)
  update(@Param('id') id: string, @Body() updateCategoriaDto: UpdateCategoriaDto) {
    return this.categoriaService.update(+id, updateCategoriaDto);
  }

  @Delete(':id')
  @Roles(Rol.ADMIN, Rol.MANAGER, Rol.USER)
  remove(@Param('id') id: string) {
    return this.categoriaService.remove(+id);
  }

  @Get('tienda/:tiendaId')
  @Roles(Rol.ADMIN, Rol.MANAGER, Rol.USER)
  getByTienda(@Param('tiendaId') tiendaId: string) {
    return this.categoriaService.getCategoriasByTienda(+tiendaId);
  }
   // SUBCATEGORIAS

  @Post('subcategorias')
  @Roles(Rol.ADMIN, Rol.MANAGER)
  createSubcategoria(@Body() createSubcategoriaDto: CreateSubcategoriaDto) {
    return this.categoriaService.createSubcategoria(createSubcategoriaDto);
  }

  @Get('subcategorias/all')
  @Roles(Rol.ADMIN, Rol.MANAGER, Rol.USER)
  findAllSubcategorias(@Query('categoriaId') categoriaId?: string) {
    return this.categoriaService.findAllSubcategorias(categoriaId ? +categoriaId : undefined);
  }

  @Get('subcategorias/:id')
  @Roles(Rol.ADMIN, Rol.MANAGER, Rol.USER)
  findOneSubcategoria(@Param('id') id: string) {
    return this.categoriaService.findOneSubcategoria(+id);
  }

  @Patch('subcategorias/:id')
  @Roles(Rol.ADMIN, Rol.MANAGER)
  updateSubcategoria(@Param('id') id: string, @Body() updateSubcategoriaDto: UpdateSubcategoriaDto) {
    return this.categoriaService.updateSubcategoria(+id, updateSubcategoriaDto);
  }

  @Delete('subcategorias/:id')
  @Roles(Rol.ADMIN, Rol.MANAGER)
  removeSubcategoria(@Param('id') id: string) {
    return this.categoriaService.removeSubcategoria(+id);
  }
}
