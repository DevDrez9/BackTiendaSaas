import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

import { CreateCarritoDto } from './dto/create-carrito.dto';
import { UpdateCarritoDto } from './dto/update-carrito.dto';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { CarritoMapper } from './mappers/carrito.mapper';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class CarritoService {
 constructor(private prisma: PrismaService) {}

  async create(createCarritoDto: CreateCarritoDto) {
    const { tiendaId, items, ...carritoData } = createCarritoDto;

    // Verificar si la tienda existe
    const tienda = await this.prisma.tienda.findUnique({
      where: { id: tiendaId },
    });

    if (!tienda) {
      throw new NotFoundException('Tienda no encontrada');
    }

    const carrito = await this.prisma.carrito.create({
      data: {
        ...carritoData,
        tiendaId,
        estado: carritoData.estado || 'pendiente',
        items: {
          create: items?.map(item => ({
            cantidad: item.cantidad,
            productoId: item.productoId,
          })) || [],
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

    return CarritoMapper.toResponseDto(carrito);
  }

  async findAll(tiendaId?: number) {
    const where = tiendaId ? { tiendaId } : {};
    
    const carritos = await this.prisma.carrito.findMany({
      where,
      include: {
        items: {
          include: {
            producto: true,
          },
        },
        tienda: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return carritos.map(carrito => CarritoMapper.toResponseDto(carrito));
  }

  async findOne(id: number) {
    const carrito = await this.prisma.carrito.findUnique({
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

    if (!carrito) {
      throw new NotFoundException('Carrito no encontrado');
    }

    return CarritoMapper.toResponseDto(carrito);
  }

  async update(id: number, updateCarritoDto: UpdateCarritoDto) {
    try {
      const { items, ...carritoData } = updateCarritoDto;

      const carrito = await this.prisma.carrito.update({
        where: { id },
        data: carritoData,
        include: {
          items: {
            include: {
              producto: true,
            },
          },
          tienda: true,
        },
      });

      return CarritoMapper.toResponseDto(carrito);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Carrito no encontrado');
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      // Eliminar items primero
      await this.prisma.carritoItem.deleteMany({
        where: { carritoId: id },
      });

      await this.prisma.carrito.delete({
        where: { id },
      });

      return { message: 'Carrito eliminado correctamente' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Carrito no encontrado');
      }
      throw error;
    }
  }

  async addItem(carritoId: number, addItemDto: AddItemDto) {
    const { productoId, cantidad } = addItemDto;

    // Verificar si el carrito existe
    const carrito = await this.prisma.carrito.findUnique({
      where: { id: carritoId },
    });

    if (!carrito) {
      throw new NotFoundException('Carrito no encontrado');
    }

    // Verificar si el producto existe y tiene stock
    const producto = await this.prisma.producto.findUnique({
      where: { id: productoId },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    if (producto.stock < cantidad) {
      throw new BadRequestException('Stock insuficiente');
    }

    // Verificar si el producto ya está en el carrito
    const existingItem = await this.prisma.carritoItem.findFirst({
      where: {
        carritoId,
        productoId,
      },
    });

    if (existingItem) {
      // Actualizar cantidad si ya existe
      const carritoItem = await this.prisma.carritoItem.update({
        where: { id: existingItem.id },
        data: {
          cantidad: existingItem.cantidad + cantidad,
        },
        include: {
          producto: true,
        },
      });

      const carritoActualizado = await this.prisma.carrito.findUnique({
        where: { id: carritoId },
        include: {
          items: {
            include: {
              producto: true,
            },
          },
          tienda: true,
        },
      });

      return CarritoMapper.toResponseDto(carritoActualizado);
    }

    // Crear nuevo item
    await this.prisma.carritoItem.create({
      data: {
        cantidad,
        productoId,
        carritoId,
      },
    });

    const carritoActualizado = await this.prisma.carrito.findUnique({
      where: { id: carritoId },
      include: {
        items: {
          include: {
            producto: true,
          },
        },
        tienda: true,
      },
    });

    return CarritoMapper.toResponseDto(carritoActualizado);
  }

  async updateItem(carritoId: number, itemId: number, updateItemDto: UpdateItemDto) {
    const { cantidad } = updateItemDto;

    // Verificar si el item existe y pertenece al carrito
    const carritoItem = await this.prisma.carritoItem.findFirst({
      where: {
        id: itemId,
        carritoId,
      },
      include: {
        producto: true,
      },
    });

    if (!carritoItem) {
      throw new NotFoundException('Item no encontrado en el carrito');
    }

    // Verificar stock si se está aumentando la cantidad
    if (cantidad > carritoItem.cantidad) {
      const incremento = cantidad - carritoItem.cantidad;
      if (carritoItem.producto.stock < incremento) {
        throw new BadRequestException('Stock insuficiente');
      }
    }

    if (cantidad === 0) {
      // Eliminar item si la cantidad es 0
      await this.prisma.carritoItem.delete({
        where: { id: itemId },
      });
    } else {
      // Actualizar cantidad
      await this.prisma.carritoItem.update({
        where: { id: itemId },
        data: { cantidad },
      });
    }

    const carritoActualizado = await this.prisma.carrito.findUnique({
      where: { id: carritoId },
      include: {
        items: {
          include: {
            producto: true,
          },
        },
        tienda: true,
      },
    });

    return CarritoMapper.toResponseDto(carritoActualizado);
  }

  async removeItem(carritoId: number, itemId: number) {
    try {
      // Verificar que el item pertenece al carrito
      const carritoItem = await this.prisma.carritoItem.findFirst({
        where: {
          id: itemId,
          carritoId,
        },
      });

      if (!carritoItem) {
        throw new NotFoundException('Item no encontrado en el carrito');
      }

      await this.prisma.carritoItem.delete({
        where: { id: itemId },
      });

      const carritoActualizado = await this.prisma.carrito.findUnique({
        where: { id: carritoId },
        include: {
          items: {
            include: {
              producto: true,
            },
          },
          tienda: true,
        },
      });

      return CarritoMapper.toResponseDto(carritoActualizado);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Item no encontrado');
      }
      throw error;
    }
  }

  async clearCart(carritoId: number) {
    const carrito = await this.prisma.carrito.findUnique({
      where: { id: carritoId },
    });

    if (!carrito) {
      throw new NotFoundException('Carrito no encontrado');
    }

    await this.prisma.carritoItem.deleteMany({
      where: { carritoId },
    });

    const carritoActualizado = await this.prisma.carrito.findUnique({
      where: { id: carritoId },
      include: {
        items: {
          include: {
            producto: true,
          },
        },
        tienda: true,
      },
    });

    return CarritoMapper.toResponseDto(carritoActualizado);
  }

  async getCarritosByTienda(tiendaId: number) {
    const tienda = await this.prisma.tienda.findUnique({
      where: { id: tiendaId },
    });

    if (!tienda) {
      throw new NotFoundException('Tienda no encontrada');
    }

    return this.findAll(tiendaId);
  }

  async convertToVenta(carritoId: number) {
    const carrito = await this.prisma.carrito.findUnique({
      where: { id: carritoId },
      include: {
        items: {
          include: {
            producto: true,
          },
        },
        tienda: true,
      },
    });

    if (!carrito) {
      throw new NotFoundException('Carrito no encontrado');
    }

    if (carrito.items.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }

    // Calcular totales
    const subtotal = carrito.items.reduce((sum, item) => {
      return sum + (Number(item.producto.precio) * item.cantidad);
    }, 0);

    const total = subtotal; // Puedes agregar impuestos aquí

    // Crear venta a partir del carrito
    const venta = await this.prisma.venta.create({
      data: {
        numeroVenta: `VENT-${Date.now()}`,
        cliente: carrito.cliente,
        telefono: carrito.telefono,
        direccion: carrito.direccion,
        estado: 'PENDIENTE',
        subtotal,
        total,
        tiendaId: carrito.tiendaId,
        items: {
          create: carrito.items.map(item => ({
            cantidad: item.cantidad,
            precio: item.producto.precio,
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

    // Limpiar carrito después de convertirlo en venta
    await this.prisma.carritoItem.deleteMany({
      where: { carritoId },
    });

    await this.prisma.carrito.update({
      where: { id: carritoId },
      data: { estado: 'completado' },
    });

    return venta;
  }
}
