import { IsString, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CarritoItemDto {
  @IsNumber()
  productoId: number;

  @IsNumber()
  cantidad: number;
}

export class CreateCarritoDto {
  @IsString()
  cliente: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsOptional()
  notas?: string;

  @IsString()
  @IsOptional()
  estado?: string;

  @IsNumber()
  tiendaId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CarritoItemDto)
  @IsOptional()
  items?: CarritoItemDto[];
}
