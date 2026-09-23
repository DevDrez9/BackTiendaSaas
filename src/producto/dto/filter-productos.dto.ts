import { IsOptional, IsNumber, IsBoolean, IsString, IsInt, Min, Max, MaxLength } from 'class-validator';
import { Transform, Type } from 'class-transformer';

// Los query params siempre llegan como string ("1", "true"):
// se convierten al tipo correcto antes de validar.
const toBoolean = ({ value }: { value: any }) => {
  if (value === 'true' || value === true || value === '1') return true;
  if (value === 'false' || value === false || value === '0') return false;
  return value;
};

export class FilterProductosDto {
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  tiendaId?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  categoriaId?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  subcategoriaId?: number;

  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  enOferta?: boolean;

  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  esNuevo?: boolean;

  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  esDestacado?: boolean;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  search?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minPrice?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxPrice?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  // Tope de 100 para que nadie pida miles de productos de golpe
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;
}
