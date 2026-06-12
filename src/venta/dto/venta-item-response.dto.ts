export class VentaItemResponseDto {
  id: number;
  cantidad: number;
  precio: number;
  productoId: number;
  ventaId: number;
  createdAt: Date;
  updatedAt: Date;
  producto?: any;

  constructor(partial: Partial<VentaItemResponseDto>) {
    Object.assign(this, partial);
  }
}
