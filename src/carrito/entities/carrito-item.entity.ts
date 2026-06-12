import { Carrito } from "./carrito.entity";

export class CarritoItem {
  id: number;
  cantidad: number;
  productoId: number;
  carritoId: number;
  createdAt: Date;
  updatedAt: Date;
  producto?: any;
  carrito?: Carrito;
}
