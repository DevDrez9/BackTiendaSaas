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
  HttpStatus,
  Query,
} from '@nestjs/common';
import { DominioService } from './dominio.service';
import { SuscripcionAccesoService } from 'src/auth/suscripcion-acceso.service';
import { BadRequestException } from '@nestjs/common';
import { UpdateMiTiendaDto, CambiarDominioDto } from './dto/update-mi-tienda.dto';
import { TiendaService } from './tienda.service';
import { CreateTiendaDto } from './dto/create-tienda.dto';
import { UpdateTiendaDto } from './dto/update-tienda.dto';
import { AuthGuard } from '@nestjs/passport'; // Asumiendo que usas JWT Auth Guard
import { Tienda } from '@prisma/client';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { TiendaOwnershipGuard } from 'src/common/guards/tienda-ownership.guard';
import { Rol } from 'src/common/rol.enum';
import { SinSuscripcion } from 'src/common/decorators/sin-suscripcion.decorator';


// @UseGuards(AuthGuard('jwt')) // Ahora protegeremos ruta por ruta
@Controller('tiendas')
export class TiendaController {
  constructor(
    private readonly tiendaService: TiendaService,
    private readonly dominioService: DominioService,
    private readonly suscripcionAcceso: SuscripcionAccesoService,
  ) {}

  /** Para validar en vivo mientras el usuario escribe su dominio. */
  @UseGuards(AuthGuard('jwt'))
  @Get('dominio-disponible')
  verificarDominio(@Query('dominio') dominio: string, @Query('tiendaId') tiendaId?: string) {
    return this.dominioService.verificar(dominio ?? '', tiendaId ? +tiendaId : undefined);
  }

  @UseGuards(AuthGuard('jwt'), TiendaOwnershipGuard)
  @Patch(':id/dominio')
  async cambiarDominio(@Param('id', ParseIntPipe) id: number, @Body() body: CambiarDominioDto) {
    const dominio = await this.dominioService.validar(body.dominio, id);
    return this.tiendaService.update(id, { dominio } as any);
  }

  @SinSuscripcion()
  @Get('dominio/:dominio')
  findByDominio(@Param('dominio') dominio: string): Promise<Tienda> {
    return this.tiendaService.findByDominioPublico(dominio);
  }

  // Las tiendas se crean en el registro; crear tiendas extra queda solo para ADMIN
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Rol.ADMIN)
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

  @SinSuscripcion() // la pantalla de pago necesita ver su tienda
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
    // El acceso de los dueños cambia al instante (sin esperar el cache de 60s)
    this.suscripcionAcceso.invalidar();
    if (body.planId !== null) {
      // Asignar plan sin meses dejaba la tienda sin fecha de vencimiento (= bloqueada)
      if (!body.meses || body.meses < 1) {
        throw new BadRequestException('Indica la cantidad de meses del plan');
      }
      return this.tiendaService.renewSubscription(id, body.planId, body.meses);
    }
    return this.tiendaService.update(id, { planId: null, suscripcionFin: null } as any);
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

  @UseGuards(AuthGuard('jwt'), TiendaOwnershipGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Tienda> {
    return this.tiendaService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'), TiendaOwnershipGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTiendaDto: UpdateMiTiendaDto, // solo nombre/descripcion/ciudad
  ): Promise<Tienda> {
    return this.tiendaService.update(id, updateTiendaDto as any);
  }

  @UseGuards(AuthGuard('jwt'), TiendaOwnershipGuard)
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Rol.ADMIN) // borrar una tienda elimina todo su contenido: solo ADMIN
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.tiendaService.remove(id);
  }
}
