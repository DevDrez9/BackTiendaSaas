import { VentaItemResponseDto } from '../dto/venta-item-response.dto';

export class VentaItemMapper {
  static toResponseDto(item: any): VentaItemResponseDto {
    return new VentaItemResponseDto({
      id: item.id,
      cantidad: item.cantidad,
      precio: Number(item.precio),
      productoId: item.productoId,
      ventaId: item.ventaId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      producto: item.producto ? {
        id: item.producto.id,
        nombre: item.producto.nombre
      } : undefined
    });
  }
}
