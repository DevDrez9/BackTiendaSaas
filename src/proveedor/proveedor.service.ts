import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';
import { CompraMapper } from './mappers/compra.mapper';
import { UpdateCompraDto } from './dto/update-compra.dto';
import { CreateCompraDto } from './dto/create-compra.dto';
import { AssignTiendaDto } from './dto/assign-tienda.dto';
import { ProveedorMapper } from './mappers/proveedor.mapper';
import { PrismaService } from 'src/prisma.service';
import { EstadoCompra } from 'src/common/estado-compra.enum';
import { TipoMovimiento } from 'src/common/tipo-movimiento.enum';

@Injectable()
export class ProveedorService {
   constructor(private prisma: PrismaService) {}

  // PROVEEDORES

  async create(createProveedorDto: CreateProveedorDto) {
    const { ruc, ...proveedorData } = createProveedorDto;

    // Verificar si el RUC ya existe
    if (ruc) {
      const existingProveedor = await this.prisma.proveedor.findUnique({
        where: { ruc },
      });

      if (existingProveedor) {
        throw new ConflictException('Ya existe un proveedor con este RUC');
      }
    }

    const proveedor = await this.prisma.proveedor.create({
      data: {
        ...proveedorData,
        ruc,
        activo: proveedorData.activo ?? true,
      },
      include: {
        productos: true,
        compras: true,
        tiendas: {
          include: {
            tienda: true,
          },
        },
      },
    });

    return ProveedorMapper.toResponseDto(proveedor);
  }

  async findAll() {
    const proveedores = await this.prisma.proveedor.findMany({
      include: {
        productos: true,
        compras: true,
        tiendas: {
          include: {
            tienda: true,
          },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    return proveedores.map(proveedor => ProveedorMapper.toResponseDto(proveedor));
  }

  async findOne(id: number) {
    const proveedor = await this.prisma.proveedor.findUnique({
      where: { id },
      include: {
        productos: {
          include: {
            categoria: true,
          },
        },
        compras: {
          include: {
            items: {
              include: {
                producto: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        tiendas: {
          include: {
            tienda: true,
          },
        },
      },
    });

    if (!proveedor) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    return ProveedorMapper.toResponseDto(proveedor);
  }

  async update(id: number, updateProveedorDto: UpdateProveedorDto) {
    const { ruc, ...proveedorData } = updateProveedorDto;

    try {
      // Si se está actualizando el RUC, verificar que no exista
      if (ruc) {
        const existingProveedor = await this.prisma.proveedor.findUnique({
          where: { ruc },
        });

        if (existingProveedor && existingProveedor.id !== id) {
          throw new ConflictException('Ya existe un proveedor con este RUC');
        }
      }

      const proveedor = await this.prisma.proveedor.update({
        where: { id },
        data: {
          ...proveedorData,
          ...(ruc && { ruc }),
        },
        include: {
          productos: true,
          compras: true,
          tiendas: {
            include: {
              tienda: true,
            },
          },
        },
      });

      return ProveedorMapper.toResponseDto(proveedor);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Proveedor no encontrado');
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      // Verificar si el proveedor tiene productos o compras
      const proveedor = await this.prisma.proveedor.findUnique({
        where: { id },
        include: {
          productos: true,
          compras: true,
        },
      });

      if (!proveedor) {
        throw new NotFoundException('Proveedor no encontrado');
      }

      if (proveedor.productos.length > 0) {
        throw new ConflictException('No se puede eliminar el proveedor porque tiene productos asociados');
      }

      if (proveedor.compras.length > 0) {
        throw new ConflictException('No se puede eliminar el proveedor porque tiene compras asociadas');
      }

      // Eliminar relaciones con tiendas primero
      await this.prisma.proveedorTienda.deleteMany({
        where: { proveedorId: id },
      });

      await this.prisma.proveedor.delete({
        where: { id },
      });

      return { message: 'Proveedor eliminado correctamente' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Proveedor no encontrado');
      }
      throw error;
    }
  }

  async assignTienda(proveedorId: number, assignTiendaDto: AssignTiendaDto) {
    const { tiendaId } = assignTiendaDto;

    // Verificar si el proveedor existe
    const proveedor = await this.prisma.proveedor.findUnique({
      where: { id: proveedorId },
    });

    if (!proveedor) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    // Verificar si la tienda existe
    const tienda = await this.prisma.tienda.findUnique({
      where: { id: tiendaId },
    });

    if (!tienda) {
      throw new NotFoundException('Tienda no encontrada');
    }

    // Verificar si la asignación ya existe
    const existingAssignment = await this.prisma.proveedorTienda.findUnique({
      where: {
        proveedorId_tiendaId: {
          proveedorId,
          tiendaId,
        },
      },
    });

    if (existingAssignment) {
      throw new ConflictException('El proveedor ya está asignado a esta tienda');
    }

    await this.prisma.proveedorTienda.create({
      data: {
        proveedorId,
        tiendaId,
      },
    });

    return { message: 'Proveedor asignado a la tienda correctamente' };
  }

  async removeTienda(proveedorId: number, tiendaId: number) {
    try {
      await this.prisma.proveedorTienda.delete({
        where: {
          proveedorId_tiendaId: {
            proveedorId,
            tiendaId,
          },
        },
      });

      return { message: 'Proveedor removido de la tienda correctamente' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Asignación no encontrada');
      }
      throw error;
    }
  }

  async getProveedorTiendas(proveedorId: number) {
    const proveedor = await this.prisma.proveedor.findUnique({
      where: { id: proveedorId },
      include: {
        tiendas: {
          include: {
            tienda: true,
          },
        },
      },
    });

    if (!proveedor) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    return proveedor.tiendas.map(proveedorTienda => proveedorTienda.tienda);
  }

  // COMPRAS

  async createCompra(createCompraDto: CreateCompraDto) {
    const { proveedorId, items, ...compraData } = createCompraDto;

    // Verificar si el proveedor existe
    const proveedor = await this.prisma.proveedor.findUnique({
      where: { id: proveedorId },
    });

    if (!proveedor) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    // Verificar que todos los productos existan
    for (const item of items) {
      const producto = await this.prisma.producto.findUnique({
        where: { id: item.productoId },
      });

      if (!producto) {
        throw new NotFoundException(`Producto con ID ${item.productoId} no encontrado`);
      }
    }

    // Calcular totales
    const subtotal = items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const impuestos = compraData.impuestos || 0;
    const total = subtotal + impuestos;

    // Generar número de compra
    const numeroCompra = compraData.numeroCompra || `COMP-${Date.now()}`;

    const estado = compraData.estado 
    ? (compraData.estado as EstadoCompra)  // Casting a enum
    : EstadoCompra.PENDIENTE;              // Valor por defecto

    const compra = await this.prisma.$transaction(async (prisma) => {
      const nuevaCompra = await prisma.compraProveedor.create({
        data: {
          numeroCompra,
          proveedorId,
          estado: estado,
          subtotal,
          impuestos,
          total,
          fechaEntrega: compraData.fechaEntrega,
          items: {
            create: items.map(item => ({
              cantidad: item.cantidad,
              precio: item.precio,
              productoId: item.productoId,
            })),
          },
        },
        include: {
          proveedor: true,
          items: {
            include: {
              producto: true,
            },
          },
        },
      });

      // Si la compra está confirmada, actualizar stock
      if (nuevaCompra.estado === EstadoCompra.CONFIRMADA) {
        for (const item of items) {
          await prisma.producto.update({
            where: { id: item.productoId },
            data: {
              stock: {
                increment: item.cantidad,
              },
            },
          });

          // Registrar movimiento de inventario
          await prisma.movimientoInventario.create({
            data: {
              tipo: TipoMovimiento.ENTRADA,
              cantidad: item.cantidad,
              productoId: item.productoId,
              compraId: nuevaCompra.id,
              motivo: `Compra proveedor: ${numeroCompra}`,
            },
          });
        }
      }

      return nuevaCompra;
    });

    return CompraMapper.toResponseDto(compra);
  }

  async findAllCompras(proveedorId?: number) {
    const where = proveedorId ? { proveedorId } : {};
    
    const compras = await this.prisma.compraProveedor.findMany({
      where,
      include: {
        proveedor: true,
        items: {
          include: {
            producto: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return compras.map(compra => CompraMapper.toResponseDto(compra));
  }

  async findOneCompra(id: number) {
    const compra = await this.prisma.compraProveedor.findUnique({
      where: { id },
      include: {
        proveedor: true,
        items: {
          include: {
            producto: true,
          },
        },
        movimientos: true,
      },
    });

    if (!compra) {
      throw new NotFoundException('Compra no encontrada');
    }

    return CompraMapper.toResponseDto(compra);
  }

  async updateCompra(id: number, updateCompraDto: UpdateCompraDto) {
    // Implementación similar a createCompra pero con validaciones adicionales
    // para evitar modificar compras ya procesadas
  }

  async updateEstadoCompra(id: number, estado: EstadoCompra) {
    const compra = await this.prisma.compraProveedor.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!compra) {
      throw new NotFoundException('Compra no encontrada');
    }

    // Lógica para manejar cambios de estado y actualizar stock
  }

  async removeCompra(id: number) {
    // Implementar con validaciones para evitar eliminar compras procesadas
  }
}
