import { IsBoolean, IsNumber, IsOptional } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class FiltrosProductoDto {
  @IsNumber()
 @Type(() => Number) 
  categoriaId: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : undefined)
  subcategoriaId?: number;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  destacados?: boolean;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  enOferta?: boolean;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  nuevos?: boolean;
}
