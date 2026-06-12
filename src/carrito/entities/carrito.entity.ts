import { CarritoItem } from "./carrito-item.entity";

export class Carrito {
  id: number;
  cliente: string;
  telefono?: string;
  direccion?: string;
  notas?: string;
  estado: string;
  tiendaId: number;
  createdAt: Date;
  updatedAt: Date;
  items?: CarritoItem[];
  tienda?: any;
}
