import { MovimientoInventarioResponseDto } from '../dto/movimiento-inventario-response.dto';

export class MovimientoInventarioMapper {
  static toResponseDto(movimiento: any): MovimientoInventarioResponseDto {
    const response = new MovimientoInventarioResponseDto({
      id: movimiento.id,
      tipo: movimiento.tipo,
      cantidad: movimiento.cantidad,
      productoId: movimiento.productoId,
      motivo: movimiento.motivo || undefined,
      usuarioId: movimiento.usuarioId || undefined,
      compraId: movimiento.compraId || undefined,
      ventaId: movimiento.ventaId || undefined,
      createdAt: movimiento.createdAt,
      updatedAt: movimiento.updatedAt,
    });

    if (movimiento.producto) {
      Object.assign(response, {
        producto: {
          id: movimiento.producto.id,
          nombre: movimiento.producto.nombre,
          sku: movimiento.producto.sku
        }
      });
    }

    if (movimiento.usuario) {
      Object.assign(response, {
        usuario: {
          id: movimiento.usuario.id,
          nombre: movimiento.usuario.nombre,
          email: movimiento.usuario.email
        }
      });
    }

    if (movimiento.compra) {
      Object.assign(response, {
        compra: {
          id: movimiento.compra.id,
          numeroCompra: movimiento.compra.numeroCompra
        }
      });
    }

    if (movimiento.venta) {
      Object.assign(response, {
        venta: {
          id: movimiento.venta.id,
          numeroVenta: movimiento.venta.numeroVenta
        }
      });
    }

    return response;
  }
}
