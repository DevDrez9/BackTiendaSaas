import { Producto } from "./producto.entity";

export class ImagenProducto {
  id: number;
  url: string;
  orden: number;
  productoId: number;
  createdAt: Date;
  updatedAt: Date;
  producto?: Producto;
}
