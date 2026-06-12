export class CarritoResponseDto {
  id: number;
  cliente: string;
  telefono?: string;
  direccion?: string;
  notas?: string;
  estado: string;
  tiendaId: number;
  createdAt: Date;
  updatedAt: Date;
  items?: any[];
  tienda?: any;
  total?: number;

  constructor(partial: Partial<CarritoResponseDto>) {
    Object.assign(this, partial);
  }
}
