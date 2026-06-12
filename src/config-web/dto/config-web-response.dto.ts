import { Exclude } from 'class-transformer';

export class ConfigWebResponseDto {
  id: number;
  nombreSitio: string;
  logoUrl?: string;
  colorPrimario: string;
  colorSecundario: string;
  createdAt: Date;
  updatedAt: Date;
  banners?: any[];

  @Exclude()
  tiendas?: any[];

  constructor(partial: Partial<ConfigWebResponseDto>) {
    Object.assign(this, partial);
  }
}
