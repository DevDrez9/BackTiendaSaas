export class Subcategoria {
  id: number;
  nombre: string;
  descripcion?: string;
  categoriaId?: number;
  createdAt: Date;
  updatedAt: Date;
  productos?: any[];
}
