import { CompraResponseDto } from '../dto/compra-response.dto';

export class CompraMapper {
  static toResponseDto(compra: any): CompraResponseDto {
    const response = new CompraResponseDto({
      id: compra.id,
      numeroCompra: compra.numeroCompra,
      proveedorId: compra.proveedorId,
      estado: compra.estado,
      total: Number(compra.total),
      subtotal: Number(compra.subtotal),
      impuestos: compra.impuestos ? Number(compra.impuestos) : undefined,
      fechaEntrega: compra.fechaEntrega || undefined,
      createdAt: compra.createdAt,
      updatedAt: compra.updatedAt,
    });

    if (compra.proveedor) {
      Object.assign(response, { 
        proveedor: {
          id: compra.proveedor.id,
          nombre: compra.proveedor.nombre
        }
      });
    }

    if (compra.items) {
      Object.assign(response, { 
        items: compra.items.map((item: any) => ({
          id: item.id,
          cantidad: item.cantidad,
          precio: Number(item.precio),
          producto: item.producto ? {
            id: item.producto.id,
            nombre: item.producto.nombre,
            sku: item.producto.sku
          } : undefined
        }))
      });
    }

    return response;
  }
}
