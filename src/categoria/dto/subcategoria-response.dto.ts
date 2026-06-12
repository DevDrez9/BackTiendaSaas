export class SubcategoriaResponseDto {
  id: number;
  nombre: string;
  descripcion?: string;
  categoriaId?: number;
  createdAt: Date;
  updatedAt: Date;
  productosCount?: number;

  constructor(partial: Partial<SubcategoriaResponseDto>) {
    Object.assign(this, partial);
  }
}
