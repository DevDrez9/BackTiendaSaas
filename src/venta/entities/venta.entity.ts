import { VentaItem } from "./venta-item.entity";

export class Venta {
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
  items?: VentaItem[];
  tienda?: any;
}
