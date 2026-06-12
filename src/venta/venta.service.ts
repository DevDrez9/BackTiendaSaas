import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

import { CreateVentaDto } from './dto/create-venta.dto';
import { UpdateVentaDto } from './dto/update-venta.dto';
import { FilterVentasDto } from './dto/filter-ventas.dto';
import { VentaMapper } from './mappers/venta.mapper';
import { EstadoVenta } from 'src/common/estado-venta.enum';
import { PrismaService } from 'src/prisma.service';
import { Prisma } from '@prisma/client';


@Injectable()
export class VentaService {
   constructor(private prisma: PrismaService) {}

  async create(createVentaDto: CreateVentaDto) {
    const { tiendaId, items, ...ventaData } = createVentaDto;

    // Verificar si la tienda existe
    const tienda = await this.prisma.tienda.findUnique({
      where: { id: tiendaId },
    });

    if (!tienda) {
      throw new NotFoundException('Tienda no encontrada');
    }

    // Verificar stock y que todos los productos existan
    for (const item of items) {
      const producto = await this.prisma.producto.findUnique({
        where: { id: item.productoId },
      });

      if (!producto) {
        throw new NotFoundException(`Producto con ID ${item.productoId} no encontrado`);
      }

      if (producto.stock < item.cantidad) {
        throw new BadRequestException(`Stock insuficiente para el producto: ${producto.nombre}`);
      }
    }

    // Calcular totales
    const subtotal = items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const impuestos = ventaData.impuestos || 0;
    const total = subtotal + impuestos;

    // Generar número de venta
    const numeroVenta = `VENT-${Date.now()}`;

    const venta = await this.prisma.$transaction(async (prisma) => {
      // Crear la venta
      const nuevaVenta = await prisma.venta.create({
        data: {
          numeroVenta,
          tiendaId,
          estado: ventaData.estado || EstadoVenta.PENDIENTE,
          subtotal,
          impuestos,
          total,
          metodoPago: ventaData.metodoPago,
          cliente: ventaData.cliente,
          telefono: ventaData.telefono,
          direccion: ventaData.direccion,
          items: {
            create: items.map(item => ({
              cantidad: item.cantidad,
              precio: item.precio,
              productoId: item.productoId,
            })),
          },
        },
        include: {
          items: {
            include: {
              producto: true,
            },
          },
          tienda: true,
        },
      });

      // Si la venta está confirmada, actualizar stock
      if (nuevaVenta.estado === EstadoVenta.CONFIRMADA) {
        for (const item of items) {
          await prisma.producto.update({
            where: { id: item.productoId },
            data: {
              stock: {
                decrement: item.cantidad,
              },
            },
          });

          // Registrar movimiento de inventario
          await prisma.movimientoInventario.create({
            data: {
              tipo: 'SALIDA',
              cantidad: item.cantidad,
              productoId: item.productoId,
              ventaId: nuevaVenta.id,
              motivo: `Venta: ${numeroVenta}`,
            },
          });
        }
      }

      return nuevaVenta;
    });

    return VentaMapper.toResponseDto(venta);
  }

  async findAll(filterVentasDto: FilterVentasDto = {}) {
    const {
      tiendaId,
      estado,
      metodoPago,
      fechaInicio,
      fechaFin,
      page = 1,
      limit = 10,
    } = filterVentasDto;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (tiendaId) where.tiendaId = tiendaId;
    if (estado) where.estado = estado;
    if (metodoPago) where.metodoPago = metodoPago;

    if (fechaInicio || fechaFin) {
      where.createdAt = {};
      if (fechaInicio) where.createdAt.gte = new Date(fechaInicio);
      if (fechaFin) {
        const fechaFinDate = new Date(fechaFin);
        fechaFinDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = fechaFinDate;
      }
    }

    const [ventas, total] = await Promise.all([
      this.prisma.venta.findMany({
        where,
        include: {
          items: {
            include: {
              producto: true,
            },
          },
          tienda: true,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.venta.count({ where }),
    ]);

    return {
      data: ventas.map(venta => VentaMapper.toResponseDto(venta)),
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const venta = await this.prisma.venta.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            producto: true,
          },
        },
        tienda: true,
        movimientoInventario: true,
      },
    });

    if (!venta) {
      throw new NotFoundException('Venta no encontrada');
    }

    return VentaMapper.toResponseDto(venta);
  }

  async update(id: number, updateVentaDto: UpdateVentaDto) {
  try {
    // Extraer solo los campos que existen en el modelo Venta de Prisma
    const { items, ...ventaData } = updateVentaDto;

    // Preparar data para Prisma (solo campos existentes en el modelo)
    const data: any = { ...ventaData };

    // Si se incluye subtotal, impuestos o total, convertirlos a Decimal si es necesario
    if (data.subtotal !== undefined) data.subtotal = new Prisma.Decimal(data.subtotal);
    if (data.impuestos !== undefined) data.impuestos = new Prisma.Decimal(data.impuestos);
    if (data.total !== undefined) data.total = new Prisma.Decimal(data.total);

    const venta = await this.prisma.venta.update({
      where: { id },
      data: data, // ← Solo campos del modelo Venta
      include: {
        items: {
          include: {
            producto: true,
          },
        },
        tienda: true,
      },
    });

    // Si se enviaron items, actualizarlos por separado
    if (items && items.length > 0) {
      // Primero eliminar items existentes
      await this.prisma.ventaItem.deleteMany({
        where: { ventaId: id },
      });

      // Crear nuevos items
      await this.prisma.ventaItem.createMany({
        data: items.map(item => ({
          ...item,
          ventaId: id,
        })),
      });

      // Obtener la venta actualizada con los nuevos items
      const ventaActualizada = await this.prisma.venta.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              producto: true,
            },
          },
          tienda: true,
        },
      });

      return VentaMapper.toResponseDto(ventaActualizada);
    }

    return VentaMapper.toResponseDto(venta);
  } catch (error) {
    if (error.code === 'P2025') {
      throw new NotFoundException('Venta no encontrada');
    }
    throw error;
  }
}
  async updateEstado(id: number, estado: EstadoVenta) {
    const venta = await this.prisma.venta.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!venta) {
      throw new NotFoundException('Venta no encontrada');
    }

    // Validar transición de estado
   const transicionesValidas: Record<string, EstadoVenta[]> = {
  [EstadoVenta.PENDIENTE]: [EstadoVenta.CONFIRMADA, EstadoVenta.CANCELADA],
  [EstadoVenta.CONFIRMADA]: [EstadoVenta.EN_PROCESO, EstadoVenta.CANCELADA],
  [EstadoVenta.EN_PROCESO]: [EstadoVenta.ENVIADA, EstadoVenta.CANCELADA],
  [EstadoVenta.ENVIADA]: [EstadoVenta.ENTREGADA, EstadoVenta.CANCELADA],
  [EstadoVenta.ENTREGADA]: [],
  [EstadoVenta.CANCELADA]: [],
};

    if (!transicionesValidas[venta.estado]?.includes(estado)) {
      throw new BadRequestException(`Transición de estado inválida de ${venta.estado} a ${estado}`);
    }

    const ventaActualizada = await this.prisma.venta.update({
      where: { id },
      data: { estado },
    });

    // Si se cancela una venta confirmada, revertir stock
    if (estado === EstadoVenta.CANCELADA && venta.estado === EstadoVenta.CONFIRMADA) {
      for (const item of venta.items) {
        await this.prisma.producto.update({
          where: { id: item.productoId },
          data: {
            stock: {
              increment: item.cantidad,
            },
          },
        });
      }
    }

    return VentaMapper.toResponseDto(ventaActualizada);
  }

  async remove(id: number) {
    try {
      const venta = await this.prisma.venta.findUnique({
        where: { id },
        include: {
          items: true,
          movimientoInventario: true,
        },
      });

      if (!venta) {
        throw new NotFoundException('Venta no encontrada');
      }

      // No permitir eliminar ventas procesadas
      if (venta.estado !== EstadoVenta.PENDIENTE) {
        throw new BadRequestException('Solo se pueden eliminar ventas en estado PENDIENTE');
      }

      // Eliminar items de venta
      await this.prisma.ventaItem.deleteMany({
        where: { ventaId: id },
      });

      // Eliminar movimientos de inventario relacionados
      await this.prisma.movimientoInventario.deleteMany({
        where: { ventaId: id },
      });

      // Eliminar venta
      await this.prisma.venta.delete({
        where: { id },
      });

      return { message: 'Venta eliminada correctamente' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Venta no encontrada');
      }
      throw error;
    }
  }

  async getVentasByTienda(tiendaId: number, filterVentasDto: FilterVentasDto = {}) {
    const tienda = await this.prisma.tienda.findUnique({
      where: { id: tiendaId },
    });

    if (!tienda) {
      throw new NotFoundException('Tienda no encontrada');
    }

    return this.findAll({
      ...filterVentasDto,
      tiendaId,
    });
  }

  async getEstadisticas(tiendaId?: number) {
    const where = tiendaId ? { tiendaId } : {};

    const [totalVentas, ventasConfirmadas, totalIngresos] = await Promise.all([
      this.prisma.venta.count({ where }),
      this.prisma.venta.count({
        where: {
          ...where,
          estado: EstadoVenta.CONFIRMADA,
        },
      }),
      this.prisma.venta.aggregate({
        where: {
          ...where,
          estado: EstadoVenta.CONFIRMADA,
        },
        _sum: {
          total: true,
        },
      }),
    ]);

    return {
      totalVentas,
      ventasConfirmadas,
      totalIngresos: totalIngresos._sum.total || 0,
    };
  }
}
