import { ProveedorResponseDto } from '../dto/proveedor-response.dto';

export class ProveedorMapper {
  static toResponseDto(proveedor: any): ProveedorResponseDto {
    const response = new ProveedorResponseDto({
      id: proveedor.id,
      nombre: proveedor.nombre,
      contacto: proveedor.contacto || undefined,
      telefono: proveedor.telefono || undefined,
      email: proveedor.email || undefined,
      direccion: proveedor.direccion || undefined,
      ruc: proveedor.ruc || undefined,
      activo: proveedor.activo,
      createdAt: proveedor.createdAt,
      updatedAt: proveedor.updatedAt,
    });

    if (proveedor.productos) {
      Object.assign(response, { productosCount: proveedor.productos.length });
    }

    if (proveedor.compras) {
      Object.assign(response, { comprasCount: proveedor.compras.length });
    }

    if (proveedor.tiendas) {
      Object.assign(response, { 
        tiendas: proveedor.tiendas.map((pt: any) => pt.tienda)
      });
    }

    return response;
  }
}
