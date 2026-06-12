import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { CreateTiendaDto } from './dto/create-tienda.dto';
import { UpdateTiendaDto } from './dto/update-tienda.dto';
import { PrismaService } from 'src/prisma.service';
import { Tienda } from '@prisma/client';

@Injectable()
export class TiendaService {
  private readonly logger = new Logger(TiendaService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleSubscriptionExpirations() {
    this.logger.log('Running subscription expiration check...');
    const now = new Date();
    
    // Find stores that are active and whose subscription has expired
    const expiredStores = await this.prisma.tienda.findMany({
      where: {
        activa: true,
        suscripcionFin: {
          lt: now
        }
      }
    });

    if (expiredStores.length > 0) {
      this.logger.log(`Found ${expiredStores.length} expired stores. Deactivating...`);
      for (const store of expiredStores) {
        await this.prisma.tienda.update({
          where: { id: store.id },
          data: { activa: false }
        });
        this.logger.log(`Deactivated store ${store.id} (${store.nombre}) due to expired subscription.`);
      }
    } else {
      this.logger.log('No expired stores found.');
    }
  }

  /**
   * Crea una nueva tienda y la asocia al usuario que la crea.
   * Utiliza una transacción para asegurar la integridad de los datos.
   * @param createTiendaDto Datos para la nueva tienda.
   * @param userId ID del usuario que crea la tienda (obtenido del token JWT).
   * @returns La tienda recién creada.
   */
  async create(createTiendaDto: CreateTiendaDto, userId: number): Promise<Tienda> {
    // Usamos una transacción para asegurar que ambas operaciones (crear tienda y asociar usuario)
    // se completen exitosamente o ninguna lo haga.
    return this.prisma.$transaction(async (prisma) => {
      const nuevaTienda = await prisma.tienda.create({
        data: {
          ...createTiendaDto,
        },
      });

      // Asociamos la tienda recién creada con el usuario que la creó.
      await prisma.usuarioTienda.create({
        data: {
          tiendaId: nuevaTienda.id,
          usuarioId: userId,
        },
      });

      return nuevaTienda;
    });
  }

  /**
   * Obtiene todas las tiendas del sistema.
   * TODO: Implementar lógica de autorización para filtrar por usuario si es necesario.
   * @returns Una lista de todas las tiendas.
   */
  async findAll(): Promise<Tienda[]> {
    return this.prisma.tienda.findMany({
      include: {
        plan: true, // Incluye la información del plan asociado
      },
    });
  }

  /**
   * Obtiene una tienda específica por su ID.
   * @param id El ID de la tienda.
   * @returns La tienda encontrada.
   */
  async findOne(id: number): Promise<Tienda> {
    const tienda = await this.prisma.tienda.findUnique({
      where: { id },
      include: {
        plan: true,
        usuarios: { // Para ver qué usuarios están asociados
          include: {
            usuario: true,
          },
        },
      },
    });

    if (!tienda) {
      throw new NotFoundException(`Tienda con ID ${id} no encontrada.`);
    }
    return tienda;
  }

  /**
   * Actualiza los datos de una tienda.
   * @param id El ID de la tienda a actualizar.
   * @param updateTiendaDto Los datos a actualizar.
   * @returns La tienda actualizada.
   */
  async update(id: number, updateTiendaDto: UpdateTiendaDto): Promise<Tienda> {
    try {
      return await this.prisma.tienda.update({
        where: { id },
        data: updateTiendaDto,
      });
    } catch (error) {
      if (error.code === 'P2025') { // Código de error de Prisma para "registro no encontrado"
        throw new NotFoundException(`Tienda con ID ${id} no encontrada.`);
      }
      throw error;
    }
  }

  /**
   * Renueva o asigna una suscripción a la tienda.
   */
  async renewSubscription(id: number, planId: number, meses: number): Promise<Tienda> {
    const tienda = await this.findOne(id);
    
    // Si ya tiene una suscripción activa, sumamos los meses a la fecha de fin actual
    // Si no, iniciamos desde hoy
    const now = new Date();
    let fechaInicio = tienda.suscripcionInicio || now;
    let fechaFin = tienda.suscripcionFin && tienda.suscripcionFin > now 
      ? new Date(tienda.suscripcionFin) 
      : now;

    fechaFin.setMonth(fechaFin.getMonth() + meses);

    return await this.prisma.tienda.update({
      where: { id },
      data: {
        planId,
        activa: true,
        suscripcionInicio: fechaInicio,
        suscripcionFin: fechaFin
      }
    });
  }

  /**
   * Elimina una tienda.
   * ¡CUIDADO! Esto puede causar eliminaciones en cascada de productos, categorías, etc.
   * @param id El ID de la tienda a eliminar.
   */
  async remove(id: number): Promise<void> {
    // Primero, verificamos que la tienda exista
    const tienda = await this.findOne(id);
    if (!tienda) {
      throw new NotFoundException(`Tienda con ID ${id} no encontrada.`);
    }
    
    // Prisma se encargará de las eliminaciones en cascada si están configuradas en el schema.
    // Es buena práctica eliminar primero las relaciones manuales si es necesario.
    await this.prisma.tienda.delete({
      where: { id },
    });
  }

  /**
   * Obtiene una tienda específica por su dominio (Público).
   * @param dominio El dominio de la tienda.
   * @returns La tienda encontrada.
   */
  async findByDominio(dominio: string): Promise<Tienda> {
    const tienda = await this.prisma.tienda.findUnique({
      where: { dominio },
      include: {
        plan: true,
        configWeb: {
          include: {
            banners: true
          }
        },
      },
    });

    if (!tienda) {
      throw new NotFoundException(`Tienda con dominio ${dominio} no encontrada.`);
    }
    return tienda;
  }

  /**
   * Obtiene todas las tiendas asociadas a un usuario específico.
   * @param userId El ID del usuario.
   * @returns Una lista de tiendas.
   */
  async findByUserId(userId: number): Promise<Tienda[]> {
    const userStores = await this.prisma.usuarioTienda.findMany({
      where: { usuarioId: userId },
      include: {
        tienda: {
          include: {
            plan: true,
          }
        }
      }
    });
    return userStores.map(us => us.tienda);
  }
}
