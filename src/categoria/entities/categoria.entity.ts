import { Subcategoria } from "./subcategoria.entity";


export class Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  tiendaId: number;
  createdAt: Date;
  updatedAt: Date;
  subcategorias?: Subcategoria[];
  productos?: any[];
}
