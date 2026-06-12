import { IsOptional, IsNumber, IsBoolean, IsString } from 'class-validator';

export class FilterProductosDto {
  @IsNumber()
  @IsOptional()
  tiendaId?: number;

  @IsNumber()
  @IsOptional()
  categoriaId?: number;

  @IsNumber()
  @IsOptional()
  subcategoriaId?: number;

  @IsBoolean()
  @IsOptional()
  enOferta?: boolean;

  @IsBoolean()
  @IsOptional()
  esNuevo?: boolean;

  @IsBoolean()
  @IsOptional()
  esDestacado?: boolean;

  @IsString()
  @IsOptional()
  search?: string;

  @IsNumber()
  @IsOptional()
  minPrice?: number;

  @IsNumber()
  @IsOptional()
  maxPrice?: number;

  @IsNumber()
  @IsOptional()
  page?: number;

  @IsNumber()
  @IsOptional()
  limit?: number;
}
