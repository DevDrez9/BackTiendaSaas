import { CategoriaResponseDto } from "../dto/categoria-response.dto";

export class CategoriaMapper {
  static toResponseDto(categoria: any): CategoriaResponseDto {
    const response = new CategoriaResponseDto({
      id: categoria.id,
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || undefined,
      tiendaId: categoria.tiendaId,
      createdAt: categoria.createdAt,
      updatedAt: categoria.updatedAt,
    });

    if (categoria.subcategorias) {
      Object.assign(response, { 
        subcategorias: categoria.subcategorias.map((sub: any) => ({
          id: sub.id,
          nombre: sub.nombre,
          descripcion: sub.descripcion,
          productosCount: sub.productos?.length || 0
        }))
      });
    }

    if (categoria.productos) {
      Object.assign(response, { productosCount: categoria.productos.length });
    }

    return response;
  }
}
