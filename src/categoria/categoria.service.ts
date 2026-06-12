import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { CategoriaMapper } from './mappers/categoria.mapper';
import { PrismaService } from 'src/prisma.service';
import { CreateSubcategoriaDto } from './dto/create-subcategoria.dto';
import { SubcategoriaMapper } from './mappers/subcategoria.mapper';
import { UpdateSubcategoriaDto } from './dto/update-subcategoria.dto';

@Injectable()
export class CategoriaService {
  constructor(private prisma: PrismaService) {}

  // CATEGORIAS

  async create(createCategoriaDto: CreateCategoriaDto) {
    const { nombre, tiendaId, ...rest } = createCategoriaDto;

    // Verificar si la tienda existe
    const tienda = await this.prisma.tienda.findUnique({
      where: { id: tiendaId },
    });

    if (!tienda) {
      throw new NotFoundException('Tienda no encontrada');
    }

    // Verificar si ya existe una categoría con el mismo nombre en la tienda
    const existingCategoria = await this.prisma.categoria.findFirst({
      where: {
        nombre,
        tiendaId,
      },
    });

    if (existingCategoria) {
      throw new ConflictException('Ya existe una categoría con este nombre en la tienda');
    }

    const categoria = await this.prisma.categoria.create({
      data: {
        nombre,
        tiendaId,
        ...rest,
      },
      include: {
        subcategorias: true,
        productos: true,
      },
    });

    return CategoriaMapper.toResponseDto(categoria);
  }

  async findAll(tiendaId?: number) {
    const where = tiendaId ? { tiendaId } : {};
    
    const categorias = await this.prisma.categoria.findMany({
      where,
      include: {
        subcategorias: true,
        productos: true,
        tienda: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    return categorias.map(categoria => CategoriaMapper.toResponseDto(categoria));
  }

  async findOne(id: number) {
    const categoria = await this.prisma.categoria.findUnique({
      where: { id },
      include: {
        subcategorias: {
          include: {
            productos: true,
          },
        },
        productos: true,
        tienda: true,
      },
    });

    if (!categoria) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return CategoriaMapper.toResponseDto(categoria);
  }

  async update(id: number, updateCategoriaDto: UpdateCategoriaDto) {
    const { nombre, tiendaId, ...rest } = updateCategoriaDto;

    try {
      // Si se está actualizando el nombre, verificar que no exista otra categoría con el mismo nombre en la tienda
      if (nombre) {
        const existingCategoria = await this.prisma.categoria.findFirst({
          where: {
            nombre,
            tiendaId: tiendaId || undefined,
            NOT: { id },
          },
        });

        if (existingCategoria) {
          throw new ConflictException('Ya existe una categoría con este nombre en la tienda');
        }
      }

      const categoria = await this.prisma.categoria.update({
        where: { id },
        data: {
          ...(nombre && { nombre }),
          ...(tiendaId && { tiendaId }),
          ...rest,
        },
        include: {
          subcategorias: true,
          productos: true,
        },
      });

      return CategoriaMapper.toResponseDto(categoria);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Categoría no encontrada');
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      // Primero verificar si tiene productos
      const categoria = await this.prisma.categoria.findUnique({
        where: { id },
        include: {
          productos: true,
          subcategorias: {
            include: {
              productos: true,
            },
          },
        },
      });

      if (!categoria) {
        throw new NotFoundException('Categoría no encontrada');
      }

      // Verificar si tiene productos directamente
      if (categoria.productos.length > 0) {
        throw new ConflictException('No se puede eliminar la categoría porque tiene productos asociados');
      }

      // Verificar si subcategorías tienen productos
      const subcategoriasConProductos = categoria.subcategorias.filter(
        sub => sub.productos.length > 0
      );

      if (subcategoriasConProductos.length > 0) {
        throw new ConflictException('No se puede eliminar la categoría porque sus subcategorías tienen productos asociados');
      }

      // Eliminar subcategorías primero
      await this.prisma.subcategoria.deleteMany({
        where: { categoriaId: id },
      });

      // Eliminar categoría
      await this.prisma.categoria.delete({
        where: { id },
      });

      return { message: 'Categoría eliminada correctamente' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Categoría no encontrada');
      }
      throw error;
    }
  }
 async createSubcategoria(createSubcategoriaDto: CreateSubcategoriaDto) {
    const { nombre, categoriaId, ...rest } = createSubcategoriaDto;

    if (categoriaId) {
      // Verificar si la categoría existe
      const categoria = await this.prisma.categoria.findUnique({
        where: { id: categoriaId },
      });

      if (!categoria) {
        throw new NotFoundException('Categoría no encontrada');
      }

      // Verificar si ya existe una subcategoría con el mismo nombre en la categoría
      const existingSubcategoria = await this.prisma.subcategoria.findFirst({
        where: {
          nombre,
          categoriaId,
        },
      });

      if (existingSubcategoria) {
        throw new ConflictException('Ya existe una subcategoría con este nombre en la categoría');
      }
    }

    const subcategoria = await this.prisma.subcategoria.create({
      data: {
        nombre,
        ...(categoriaId && { categoriaId }),
        ...rest,
      },
      include: {
        productos: true,
        categoria: true,
      },
    });

    return SubcategoriaMapper.toResponseDto(subcategoria);
  }

  async findAllSubcategorias(categoriaId?: number) {
    const where = categoriaId ? { categoriaId } : {};
    
    const subcategorias = await this.prisma.subcategoria.findMany({
      where,
      include: {
        productos: true,
        categoria: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    return subcategorias.map(sub => SubcategoriaMapper.toResponseDto(sub));
  }

  async findOneSubcategoria(id: number) {
    const subcategoria = await this.prisma.subcategoria.findUnique({
      where: { id },
      include: {
        productos: true,
        categoria: true,
      },
    });

    if (!subcategoria) {
      throw new NotFoundException('Subcategoría no encontrada');
    }

    return SubcategoriaMapper.toResponseDto(subcategoria);
  }

  async updateSubcategoria(id: number, updateSubcategoriaDto: UpdateSubcategoriaDto) {
    const { nombre, categoriaId, ...rest } = updateSubcategoriaDto;

    try {
      // Si se está actualizando el nombre, verificar que no exista otra subcategoría con el mismo nombre
      if (nombre && categoriaId) {
        const existingSubcategoria = await this.prisma.subcategoria.findFirst({
          where: {
            nombre,
            categoriaId,
            NOT: { id },
          },
        });

        if (existingSubcategoria) {
          throw new ConflictException('Ya existe una subcategoría con este nombre en la categoría');
        }
      }

      const subcategoria = await this.prisma.subcategoria.update({
        where: { id },
        data: {
          ...(nombre && { nombre }),
          ...(categoriaId && { categoriaId }),
          ...rest,
        },
        include: {
          productos: true,
          categoria: true,
        },
      });

      return SubcategoriaMapper.toResponseDto(subcategoria);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Subcategoría no encontrada');
      }
      throw error;
    }
  }

  async removeSubcategoria(id: number) {
    try {
      // Verificar si tiene productos
      const subcategoria = await this.prisma.subcategoria.findUnique({
        where: { id },
        include: {
          productos: true,
        },
      });

      if (!subcategoria) {
        throw new NotFoundException('Subcategoría no encontrada');
      }

      if (subcategoria.productos.length > 0) {
        throw new ConflictException('No se puede eliminar la subcategoría porque tiene productos asociados');
      }

      await this.prisma.subcategoria.delete({
        where: { id },
      });

      return { message: 'Subcategoría eliminada correctamente' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Subcategoría no encontrada');
      }
      throw error;
    }
  }

  async getCategoriasByTienda(tiendaId: number) {
    const tienda = await this.prisma.tienda.findUnique({
      where: { id: tiendaId },
    });

    if (!tienda) {
      throw new NotFoundException('Tienda no encontrada');
    }

    const categorias = await this.prisma.categoria.findMany({
      where: { tiendaId },
      include: {
        subcategorias: {
          include: {
            productos: true,
          },
        },
        productos: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    return categorias.map(categoria => CategoriaMapper.toResponseDto(categoria));
  }
}
