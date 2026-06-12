import { BadRequestException, ConflictException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { PrismaService } from 'src/prisma.service';


import { FilterProductosDto } from './dto/filter-productos.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { ProductoMapper } from './mappers/producto.mapper';
import { ImagenProductoMapper } from './mappers/imagen-producto.mapper';
import { TipoMovimiento } from 'src/common/tipo-movimiento.enum';

@Injectable()
export class ProductoService {

     constructor(private prisma: PrismaService) {}

  async create(createProductoDto: CreateProductoDto) {
    const { imagenes, ...productoData } = createProductoDto;

    // Verificar si la tienda existe
    const tienda = await this.prisma.tienda.findUnique({
      where: { id: productoData.tiendaId },
    });

    if (!tienda) {
      throw new NotFoundException('Tienda no encontrada');
    }

    if (!tienda.planId) {
      throw new ForbiddenException('La tienda no tiene una suscripción activa para subir productos');
    }

    // Verificar si la categoría existe (si se proporciona)
    if (productoData.categoriaId) {
      const categoria = await this.prisma.categoria.findUnique({
        where: { id: productoData.categoriaId },
      });

      if (!categoria) {
        throw new NotFoundException('Categoría no encontrada');
      }
    }

    // Verificar si la subcategoría existe (si se proporciona)
    if (productoData.subcategoriaId) {
      const subcategoria = await this.prisma.subcategoria.findUnique({
        where: { id: productoData.subcategoriaId },
      });

      if (!subcategoria) {
        throw new NotFoundException('Subcategoría no encontrada');
      }
    }

    // Verificar si el proveedor existe (si se proporciona)
    if (productoData.proveedorId) {
      const proveedor = await this.prisma.proveedor.findUnique({
        where: { id: productoData.proveedorId },
      });

      if (!proveedor) {
        throw new NotFoundException('Proveedor no encontrado');
      }
    }

    // Verificar si el SKU ya existe en la tienda
    if (productoData.sku) {
      const existingProducto = await this.prisma.producto.findFirst({
        where: {
          sku: productoData.sku,
          tiendaId: productoData.tiendaId,
        },
      });

      if (existingProducto) {
        throw new ConflictException('Ya existe un producto con este SKU en la tienda');
      }
    }

    const producto = await this.prisma.producto.create({
      data: {
        ...productoData,
        precio: productoData.precio,
        precioOferta: productoData.precioOferta,
        imagenes: {
          create: imagenes?.map((img, index) => ({
            ...img,
            orden: img.orden ?? index,
          })) || [],
        },
      },
      include: {
        imagenes: true,
        categoria: true,
        subcategoria: true,
        tienda: true,
        proveedor: true,
      },
    });

    return ProductoMapper.toResponseDto(producto);
  }

  async findAll(filterProductosDto: FilterProductosDto = {}) {
    const {
      tiendaId,
      categoriaId,
      subcategoriaId,
      enOferta,
      esNuevo,
      esDestacado,
      search,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
    } = filterProductosDto;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (tiendaId) where.tiendaId = tiendaId;
    if (categoriaId) where.categoriaId = categoriaId;
    if (subcategoriaId) where.subcategoriaId = subcategoriaId;
    if (enOferta !== undefined) where.enOferta = enOferta;
    if (esNuevo !== undefined) where.esNuevo = esNuevo;
    if (esDestacado !== undefined) where.esDestacado = esDestacado;

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.precio = {};
      if (minPrice !== undefined) where.precio.gte = minPrice;
      if (maxPrice !== undefined) where.precio.lte = maxPrice;
    }

    const [productos, total] = await Promise.all([
      this.prisma.producto.findMany({
        where,
        include: {
          imagenes: true,
          categoria: true,
          subcategoria: true,
          tienda: true,
          proveedor: true,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.producto.count({ where }),
    ]);

    return {
      data: productos.map(producto => ProductoMapper.toResponseDto(producto)),
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const producto = await this.prisma.producto.findUnique({
      where: { id },
      include: {
        imagenes: {
          orderBy: { orden: 'asc' },
        },
        categoria: true,
        subcategoria: true,
        tienda: true,
        proveedor: true,
        movimientos: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    return ProductoMapper.toResponseDto(producto);
  }

  async update(id: number, updateProductoDto: UpdateProductoDto) {
    const { imagenes, ...productoData } = updateProductoDto;

    try {
      // Verificar si el producto existe
      const existingProducto = await this.prisma.producto.findUnique({
        where: { id },
      });

      if (!existingProducto) {
        throw new NotFoundException('Producto no encontrado');
      }

      // Verificar si el SKU ya existe en la tienda (si se está actualizando)
      if (productoData.sku && productoData.sku !== existingProducto.sku) {
        const existingSku = await this.prisma.producto.findFirst({
          where: {
            sku: productoData.sku,
            tiendaId: productoData.tiendaId || existingProducto.tiendaId,
            NOT: { id },
          },
        });

        if (existingSku) {
          throw new ConflictException('Ya existe un producto con este SKU en la tienda');
        }
      }

      const producto = await this.prisma.producto.update({
        where: { id },
        data: productoData,
        include: {
          imagenes: true,
          categoria: true,
          subcategoria: true,
          tienda: true,
          proveedor: true,
        },
      });

      // Si hay imágenes para actualizar
      if (imagenes) {
        // Eliminar imágenes existentes
        await this.prisma.imagenProducto.deleteMany({
          where: { productoId: id },
        });

        // Crear nuevas imágenes
        await this.prisma.imagenProducto.createMany({
          data: imagenes.map((img, index) => ({
            ...img,
            productoId: id,
            orden: img.orden ?? index,
          })),
        });

        // Obtener el producto con las nuevas imágenes
        const updatedProducto = await this.prisma.producto.findUnique({
          where: { id },
          include: {
            imagenes: {
              orderBy: { orden: 'asc' },
            },
            categoria: true,
            subcategoria: true,
            tienda: true,
            proveedor: true,
          },
        });

        return ProductoMapper.toResponseDto(updatedProducto);
      }

      return ProductoMapper.toResponseDto(producto);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Producto no encontrado');
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      // Verificar si el producto existe y tiene relaciones
      const producto = await this.prisma.producto.findUnique({
        where: { id },
        include: {
          carritoItem: true,
          ventaItems: true,
        },
      });

      if (!producto) {
        throw new NotFoundException('Producto no encontrado');
      }

      if (producto.carritoItem.length > 0 || producto.ventaItems.length > 0) {
        throw new ConflictException('No se puede eliminar el producto porque tiene relaciones activas');
      }

      // Eliminar imágenes primero
      await this.prisma.imagenProducto.deleteMany({
        where: { productoId: id },
      });

      // Eliminar movimientos de inventario
      await this.prisma.movimientoInventario.deleteMany({
        where: { productoId: id },
      });

      // Eliminar producto
      await this.prisma.producto.delete({
        where: { id },
      });

      return { message: 'Producto eliminado correctamente' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Producto no encontrado');
      }
      throw error;
    }
  }

  async updateStock(id: number, updateStockDto: UpdateStockDto) {
    const { cantidad, tipo, motivo } = updateStockDto;

    const producto = await this.prisma.producto.findUnique({
      where: { id },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    let nuevoStock = producto.stock;

    switch (tipo) {
      case TipoMovimiento.ENTRADA:
        nuevoStock += cantidad;
        break;
      case TipoMovimiento.SALIDA:
        if (producto.stock < cantidad) {
          throw new BadRequestException('Stock insuficiente');
        }
        nuevoStock -= cantidad;
        break;
      case TipoMovimiento.AJUSTE:
        if (cantidad < 0) {
          throw new BadRequestException('El ajuste no puede ser negativo');
        }
        nuevoStock = cantidad;
        break;
      default:
        throw new BadRequestException('Tipo de movimiento inválido');
    }

    const transaction = await this.prisma.$transaction(async (prisma) => {
      // Actualizar stock del producto
      const productoActualizado = await prisma.producto.update({
        where: { id },
        data: { stock: nuevoStock },
      });

      // Crear movimiento de inventario - USAR EL ENUM DIRECTAMENTE
      await prisma.movimientoInventario.create({
        data: {
          tipo: tipo, // ← Usar el enum directamente
          cantidad: Math.abs(cantidad),
          productoId: id,
          motivo: motivo || `Ajuste de stock ${tipo.toLowerCase()}`,
          stockAnterior: producto.stock,
          stockNuevo: nuevoStock,
        },
      });

      return productoActualizado;
    });

    return ProductoMapper.toResponseDto(transaction);
  }

  async getProductosByTienda(tiendaId: number, filterProductosDto: FilterProductosDto = {}) {
    const tienda = await this.prisma.tienda.findUnique({
      where: { id: tiendaId },
    });

    if (!tienda) {
      throw new NotFoundException('Tienda no encontrada');
    }

    return this.findAll({
      ...filterProductosDto,
      tiendaId,
    });
  }

  async getProductosByCategoria(categoriaId: number, filterProductosDto: FilterProductosDto = {}) {
    const categoria = await this.prisma.categoria.findUnique({
      where: { id: categoriaId },
    });

    if (!categoria) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return this.findAll({
      ...filterProductosDto,
      categoriaId,
    });
  }

  async getProductosBySubcategoria(subcategoriaId: number, filterProductosDto: FilterProductosDto = {}) {
    const subcategoria = await this.prisma.subcategoria.findUnique({
      where: { id: subcategoriaId },
    });

    if (!subcategoria) {
      throw new NotFoundException('Subcategoría no encontrada');
    }

    return this.findAll({
      ...filterProductosDto,
      subcategoriaId,
    });
  }

  async getProductosDestacados(tiendaId: number, limit: number = 10) {
    const productos = await this.prisma.producto.findMany({
      where: {
        tiendaId,
        esDestacado: true,
        stock: { gt: 0 },
      },
      include: {
        imagenes: true,
        categoria: true,
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return productos.map(producto => ProductoMapper.toResponseDto(producto));
  }

  async getProductosOferta(tiendaId: number, limit: number = 10) {
    const productos = await this.prisma.producto.findMany({
      where: {
        tiendaId,
        enOferta: true,
        stock: { gt: 0 },
      },
      include: {
        imagenes: true,
        categoria: true,
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return productos.map(producto => ProductoMapper.toResponseDto(producto));
  }

  async getProductosNuevos(tiendaId: number, limit: number = 10) {
    const productos = await this.prisma.producto.findMany({
      where: {
        tiendaId,
        esNuevo: true,
        stock: { gt: 0 },
      },
      include: {
        imagenes: true,
        categoria: true,
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return productos.map(producto => ProductoMapper.toResponseDto(producto));
  }

  async addImagen(productoId: number, imagenData: any) {
    const producto = await this.prisma.producto.findUnique({
      where: { id: productoId },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    // Obtener el último orden
    const lastImagen = await this.prisma.imagenProducto.findFirst({
      where: { productoId },
      orderBy: { orden: 'desc' },
    });

    const imagen = await this.prisma.imagenProducto.create({
      data: {
        ...imagenData,
        productoId,
        orden: imagenData.orden ?? (lastImagen ? lastImagen.orden + 1 : 0),
      },
    });

    return ImagenProductoMapper.toResponseDto(imagen);
  }

  async removeImagen(imagenId: number) {
    try {
      await this.prisma.imagenProducto.delete({
        where: { id: imagenId },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Imagen no encontrada');
      }
      throw error;
    }
  }
}
