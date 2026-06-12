import { Venta } from "./venta.entity";

export class VentaItem {
  id: number;
  cantidad: number;
  precio: number;
  productoId: number;
  ventaId: number;
  createdAt: Date;
  updatedAt: Date;
  producto?: any;
  venta?: Venta;
}
