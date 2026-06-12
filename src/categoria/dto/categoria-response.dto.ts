import { Exclude } from 'class-transformer';

export class CategoriaResponseDto {
  id: number;
  nombre: string;
  descripcion?: string;
  tiendaId: number;
  createdAt: Date;
  updatedAt: Date;
  subcategorias?: any[];
  productosCount?: number;

  @Exclude()
  productos?: any[];

  constructor(partial: Partial<CategoriaResponseDto>) {
    Object.assign(this, partial);
  }
}
