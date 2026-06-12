import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

import { CreateMovimientoInventarioDto } from './dto/create-movimiento-inventario.dto';
import { FilterMovimientosDto } from './dto/filter-movimientos.dto';
import { MovimientoInventarioMapper } from './mappers/movimiento-inventario.mapper';
import { TipoMovimiento } from 'src/common/tipo-movimiento.enum';
import { PrismaService } from 'src/prisma.service';


@Injectable()
export class MovimientoInventarioService {
   constructor(private prisma: PrismaService) {}

  async create(createMovimientoDto: CreateMovimientoInventarioDto) {
    const { productoId, tipo, cantidad, ...movimientoData } = createMovimientoDto;

    // Verificar si el producto existe
    const producto = await this.prisma.producto.findUnique({
      where: { id: productoId },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    // Verificar stock para movimientos de salida
    if (tipo === TipoMovimiento.SALIDA && producto.stock < cantidad) {
      throw new BadRequestException('Stock insuficiente para realizar la salida');
    }

    // Calcular nuevo stock
    let nuevoStock = producto.stock;
    switch (tipo) {
      case TipoMovimiento.ENTRADA:
        nuevoStock += cantidad;
        break;
      case TipoMovimiento.SALIDA:
        nuevoStock -= cantidad;
        break;
      case TipoMovimiento.AJUSTE:
        if (cantidad < 0) {
          throw new BadRequestException('El ajuste no puede ser negativo');
        }
        nuevoStock = cantidad;
        break;
    }

    const movimiento = await this.prisma.$transaction(async (prisma) => {
      // Actualizar stock del producto
      await prisma.producto.update({
        where: { id: productoId },
        data: { stock: nuevoStock },
      });

      // Crear movimiento de inventario
      const nuevoMovimiento = await prisma.movimientoInventario.create({
        data: {
          tipo: tipo,
          cantidad: Math.abs(cantidad),
          productoId,
          ...movimientoData,
        },
        include: {
          producto: true,
          usuario: true,
          compra: true,
          venta: true,
        },
      });

      return nuevoMovimiento;
    });

    return MovimientoInventarioMapper.toResponseDto(movimiento);
  }

  async findAll(filterMovimientosDto: FilterMovimientosDto = {}) {
    const {
      productoId,
      tipo,
      usuarioId,
      compraId,
      ventaId,
      fechaInicio,
      fechaFin,
      page = 1,
      limit = 10,
    } = filterMovimientosDto;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (productoId) where.productoId = productoId;
    if (tipo) where.tipo = tipo.toString();
    if (usuarioId) where.usuarioId = usuarioId;
    if (compraId) where.compraId = compraId;
    if (ventaId) where.ventaId = ventaId;

    if (fechaInicio || fechaFin) {
      where.createdAt = {};
      if (fechaInicio) where.createdAt.gte = new Date(fechaInicio);
      if (fechaFin) {
        const fechaFinDate = new Date(fechaFin);
        fechaFinDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = fechaFinDate;
      }
    }

    const [movimientos, total] = await Promise.all([
      this.prisma.movimientoInventario.findMany({
        where,
        include: {
          producto: true,
          usuario: true,
          compra: true,
          venta: true,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.movimientoInventario.count({ where }),
    ]);

    return {
      data: movimientos.map(movimiento => MovimientoInventarioMapper.toResponseDto(movimiento)),
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const movimiento = await this.prisma.movimientoInventario.findUnique({
      where: { id },
      include: {
        producto: true,
        usuario: true,
        compra: true,
        venta: true,
      },
    });

    if (!movimiento) {
      throw new NotFoundException('Movimiento de inventario no encontrado');
    }

    return MovimientoInventarioMapper.toResponseDto(movimiento);
  }

  async findByProducto(productoId: number, filterMovimientosDto: FilterMovimientosDto = {}) {
    const producto = await this.prisma.producto.findUnique({
      where: { id: productoId },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    return this.findAll({
      ...filterMovimientosDto,
      productoId,
    });
  }

  async getStockHistory(productoId: number, days: number = 30) {
    const producto = await this.prisma.producto.findUnique({
      where: { id: productoId },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - days);

    const movimientos = await this.prisma.movimientoInventario.findMany({
      where: {
        productoId,
        createdAt: {
          gte: fechaInicio,
        },
      },
      include: {
        producto: true,
        usuario: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Calcular historial de stock
    let stockActual = producto.stock;
    const historial = movimientos.reverse().map(movimiento => {
      let cambio = 0;
      switch (movimiento.tipo) {
        case 'ENTRADA':
          cambio = movimiento.cantidad;
          stockActual -= cambio; // Retroceder para calcular el stock anterior
          break;
        case 'SALIDA':
          cambio = -movimiento.cantidad;
          stockActual += movimiento.cantidad; // Retroceder para calcular el stock anterior
          break;
        case 'AJUSTE':
          // Para ajustes, necesitamos saber el stock anterior (esto es más complejo)
          cambio = movimiento.cantidad - stockActual;
          stockActual = movimiento.cantidad;
          break;
      }

      return {
        ...MovimientoInventarioMapper.toResponseDto(movimiento),
        stockAnterior: stockActual,
        stockNuevo: stockActual + cambio,
        cambio,
      };
    }).reverse();

    return {
      producto: {
        id: producto.id,
        nombre: producto.nombre,
        sku: producto.sku,
        stockActual: producto.stock,
      },
      historial,
    };
  }

  async getMovimientosByUsuario(usuarioId: number, filterMovimientosDto: FilterMovimientosDto = {}) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.findAll({
      ...filterMovimientosDto,
      usuarioId,
    });
  }

  async getMovimientosByCompra(compraId: number) {
    const compra = await this.prisma.compraProveedor.findUnique({
      where: { id: compraId },
    });

    if (!compra) {
      throw new NotFoundException('Compra no encontrada');
    }

    return this.findAll({ compraId });
  }

  async getMovimientosByVenta(ventaId: number) {
    const venta = await this.prisma.venta.findUnique({
      where: { id: ventaId },
    });

    if (!venta) {
      throw new NotFoundException('Venta no encontrada');
    }

    return this.findAll({ ventaId });
  }

  async getResumenMovimientos(productoId?: number, days: number = 30) {
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - days);

    const where: any = {
      createdAt: {
        gte: fechaInicio,
      },
    };

    if (productoId) {
      where.productoId = productoId;
    }

    const movimientos = await this.prisma.movimientoInventario.groupBy({
      by: ['tipo'],
      where,
      _sum: {
        cantidad: true,
      },
      _count: {
        id: true,
      },
    });

    return movimientos.map(item => ({
      tipo: item.tipo,
      totalCantidad: item._sum.cantidad,
      totalMovimientos: item._count.id,
    }));
  }

  async getProductosBajoStock(minimo: number = 5) {
    const productos = await this.prisma.producto.findMany({
      where: {
        stock: {
          lte: minimo,
        },
      },
      include: {
        movimientos: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Últimos 7 días
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
      },
      orderBy: {
        stock: 'asc',
      },
    });

    return productos.map(producto => ({
      id: producto.id,
      nombre: producto.nombre,
      sku: producto.sku,
      stock: producto.stock,
      stockMinimo: producto.stockMinimo,
      ultimosMovimientos: producto.movimientos.map(mov => ({
        tipo: mov.tipo,
        cantidad: mov.cantidad,
        fecha: mov.createdAt,
        motivo: mov.motivo,
      })),
    }));
  }
}
