import { Exclude } from 'class-transformer';

export class ProveedorResponseDto {
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
  productosCount?: number;
  comprasCount?: number;

  @Exclude()
  productos?: any[];

  @Exclude()
  compras?: any[];

  @Exclude()
  tiendas?: any[];

  constructor(partial: Partial<ProveedorResponseDto>) {
    Object.assign(this, partial);
  }
}
