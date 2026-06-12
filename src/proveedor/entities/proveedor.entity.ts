export class Proveedor {
  id: number;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ruc?: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
  productos?: any[];
  compras?: any[];
  tiendas?: any[];
}
