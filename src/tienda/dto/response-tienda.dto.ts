import { Exclude } from 'class-transformer';

export class TiendaResponseDto {
  id: number;
  nombre: string;
  descripcion?: string;
  dominio: string;
  ciudad?: string;
  activa: boolean;
  configWebId: number;
  createdAt: Date;
  updatedAt: Date;

  @Exclude()
  configWeb?: any;

  constructor(partial: Partial<TiendaResponseDto>) {
    Object.assign(this, partial);
  }
}
