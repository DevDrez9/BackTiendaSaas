import { Proveedor } from "./proveedor.entity";

export class CompraProveedor {
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
  proveedor?: Proveedor;
  movimientos?: any[];
  items?: any[];
}
