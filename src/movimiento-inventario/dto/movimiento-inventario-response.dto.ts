export class MovimientoInventarioResponseDto {
  id: number;
  tipo: string;
  cantidad: number;
  productoId: number;
  motivo?: string;
  usuarioId?: number;
  compraId?: number;
  ventaId?: number;
  createdAt: Date;
  updatedAt: Date;
  producto?: any;
  usuario?: any;
  compra?: any;
  venta?: any;

  constructor(partial: Partial<MovimientoInventarioResponseDto>) {
    Object.assign(this, partial);
  }
}
