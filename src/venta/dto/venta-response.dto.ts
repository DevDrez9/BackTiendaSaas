export class VentaResponseDto {
  id: number;
  numeroVenta: string;
  cliente: string;
  telefono?: string;
  direccion?: string;
  estado: string;
  total: number;
  subtotal: number;
  impuestos?: number;
  metodoPago?: string;
  tiendaId: number;
  createdAt: Date;
  updatedAt: Date;
  items?: any[];
  tienda?: any;

  constructor(partial: Partial<VentaResponseDto>) {
    Object.assign(this, partial);
  }
}
