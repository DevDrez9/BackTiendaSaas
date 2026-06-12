import { SubcategoriaResponseDto } from '../dto/subcategoria-response.dto';

export class SubcategoriaMapper {
  static toResponseDto(subcategoria: any): SubcategoriaResponseDto {
    const response = new SubcategoriaResponseDto({
      id: subcategoria.id,
      nombre: subcategoria.nombre,
      descripcion: subcategoria.descripcion || undefined,
      categoriaId: subcategoria.categoriaId || undefined,
      createdAt: subcategoria.createdAt,
      updatedAt: subcategoria.updatedAt,
    });

    if (subcategoria.productos) {
      Object.assign(response, { productosCount: subcategoria.productos.length });
    }

    if (subcategoria.categoria) {
      Object.assign(response, { 
        categoria: {
          id: subcategoria.categoria.id,
          nombre: subcategoria.categoria.nombre
        }
      });
    }

    return response;
  }
}
