import { VentaResponseDto } from '../dto/venta-response.dto';

export class VentaMapper {
  static toResponseDto(venta: any): VentaResponseDto {
    const response = new VentaResponseDto({
      id: venta.id,
      numeroVenta: venta.numeroVenta,
      cliente: venta.cliente,
      telefono: venta.telefono || undefined,
      direccion: venta.direccion || undefined,
      estado: venta.estado,
      total: Number(venta.total),
      subtotal: Number(venta.subtotal),
      impuestos: venta.impuestos ? Number(venta.impuestos) : undefined,
      metodoPago: venta.metodoPago || undefined,
      tiendaId: venta.tiendaId,
      createdAt: venta.createdAt,
      updatedAt: venta.updatedAt,
    });

    if (venta.items) {
      Object.assign(response, {
        items: venta.items.map((item: any) => ({
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

    if (venta.tienda) {
      Object.assign(response, {
        tienda: {
          id: venta.tienda.id,
          nombre: venta.tienda.nombre
        }
      });
    }

    return response;
  }
}
