import { Proveedor } from "./proveedor.entity";

export class ProveedorTienda {
  id: number;
  proveedorId: number;
  tiendaId: number;
  createdAt: Date;
  updatedAt: Date;
  proveedor?: Proveedor;
  tienda?: any;
}
