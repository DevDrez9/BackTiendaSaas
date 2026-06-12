import { CarritoResponseDto } from '../dto/carrito-response.dto';

export class CarritoMapper {
  static toResponseDto(carrito: any): CarritoResponseDto {
    const response = new CarritoResponseDto({
      id: carrito.id,
      cliente: carrito.cliente,
      telefono: carrito.telefono || undefined,
      direccion: carrito.direccion || undefined,
      notas: carrito.notas || undefined,
      estado: carrito.estado,
      tiendaId: carrito.tiendaId,
      createdAt: carrito.createdAt,
      updatedAt: carrito.updatedAt,
    });

    if (carrito.items) {
      let total = 0;
      const items = carrito.items.map((item: any) => {
        const itemTotal = item.producto ? Number(item.producto.precio) * item.cantidad : 0;
        total += itemTotal;

        return {
          id: item.id,
          cantidad: item.cantidad,
          producto: item.producto ? {
            id: item.producto.id,
            nombre: item.producto.nombre,
            precio: Number(item.producto.precio),
            imagenUrl: item.producto.imagenUrl,
            stock: item.producto.stock
          } : undefined,
          total: itemTotal
        };
      });

      Object.assign(response, { items, total });
    }

    if (carrito.tienda) {
      Object.assign(response, {
        tienda: {
          id: carrito.tienda.id,
          nombre: carrito.tienda.nombre
        }
      });
    }

    return response;
  }
}
