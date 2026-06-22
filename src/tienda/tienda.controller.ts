import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  ParseIntPipe, 
  UseGuards, 
  Req, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { TiendaService } from './tienda.service';
import { CreateTiendaDto } from './dto/create-tienda.dto';
import { UpdateTiendaDto } from './dto/update-tienda.dto';
import { AuthGuard } from '@nestjs/passport'; // Asumiendo que usas JWT Auth Guard
import { Tienda } from '@prisma/client';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Rol } from 'src/common/rol.enum';


// @UseGuards(AuthGuard('jwt')) // Ahora protegeremos ruta por ruta
@Controller('tiendas')
export class TiendaController {
  constructor(private readonly tiendaService: TiendaService) {}

  @Get('dominio/:dominio')
  findByDominio(@Param('dominio') dominio: string): Promise<Tienda> {
    return this.tiendaService.findByDominio(dominio);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(
    @Body() createTiendaDto: CreateTiendaDto,
    @Req() req, // Obtenemos el objeto request
  ): Promise<Tienda> {
    const userId = req.user.id; // Extraemos el ID del usuario del payload del token
    return this.tiendaService.create(createTiendaDto, userId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('admin/all')
  @Roles(Rol.ADMIN)
  findAllAdmin(): Promise<Tienda[]> {
    return this.tiendaService.findAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(@Req() req): Promise<Tienda[]> {
    // Normal user: should return only their stores
    return this.tiendaService.findByUserId(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Patch('admin/:id/plan')
  @Roles(Rol.ADMIN)
  updatePlan(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { planId: number | null, meses?: number }
  ): Promise<Tienda> {
    if (body.planId !== null && body.meses) {
      return this.tiendaService.renewSubscription(id, body.planId, body.meses);
    }
    return this.tiendaService.update(id, { planId: body.planId } as any);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Patch('admin/:id/limit')
  @Roles(Rol.ADMIN)
  updateLimit(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { limiteProductosPersonalizado: number | null }
  ): Promise<Tienda> {
    return this.tiendaService.update(id, { limiteProductosPersonalizado: body.limiteProductosPersonalizado } as any);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Tienda> {
    // TODO: Añadir un Guard para verificar que el usuario logueado tiene permiso para ver esta tienda.
    return this.tiendaService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTiendaDto: UpdateTiendaDto,
  ): Promise<Tienda> {
    // TODO: Añadir un Guard para verificar que el usuario es propietario/manager de la tienda.
    return this.tiendaService.update(id, updateTiendaDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    // TODO: Añadir un Guard para verificar que solo el propietario puede eliminar la tienda.
    await this.tiendaService.remove(id);
  }
}
