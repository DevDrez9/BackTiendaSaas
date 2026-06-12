export class CompraResponseDto {
  id: number;
  numeroCompra: string;
  proveedorId: number;
  estado: string;
  total: number;
  subtotal: number;
  impuestos?: number;
  fechaEntrega?: Date;
  createdAt: Date;
  updatedAt: Date;
  proveedor?: any;
  items?: any[];

  constructor(partial: Partial<CompraResponseDto>) {
    Object.assign(this, partial);
  }
}
