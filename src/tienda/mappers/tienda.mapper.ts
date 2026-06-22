import { Tienda } from "@prisma/client";
import { TiendaResponseDto } from "../dto/response-tienda.dto";

export class TiendaMapper {
  static toResponseDto(tienda: Tienda): TiendaResponseDto {
    return new TiendaResponseDto({
      id: tienda.id,
      nombre: tienda.nombre,
      descripcion: tienda.descripcion || undefined,
      dominio: tienda.dominio,
      ciudad: tienda.ciudad || undefined,
      activa: tienda.activa,
      configWebId: tienda.configWebId,
      createdAt: tienda.createdAt,
      updatedAt: tienda.updatedAt,
    });
  }

  static toResponseDtoWithRelations(tienda: any): TiendaResponseDto {
    const response = this.toResponseDto(tienda);
    
    // Agregar relaciones si existen
    if (tienda.categorias) {
      Object.assign(response, { categorias: tienda.categorias });
    }
    if (tienda.usuarios) {
      Object.assign(response, { usuarios: tienda.usuarios });
    }
    if (tienda.productos) {
      Object.assign(response, { productos: tienda.productos });
    }

    return response;
  }
}
