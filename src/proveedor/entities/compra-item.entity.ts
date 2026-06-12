import { CompraProveedor } from "./compra-proveedor.entity";

export class CompraItem {
  id: number;
  cantidad: number;
  precio: number;
  productoId: number;
  compraId: number;
  createdAt: Date;
  updatedAt: Date;
  producto?: any;
  compra?: CompraProveedor;
}
