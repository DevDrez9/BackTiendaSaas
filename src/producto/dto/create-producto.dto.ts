import { IsString, IsOptional, IsNumber, IsBoolean, IsDecimal, IsUrl, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
class ImagenProductoDto {
  @IsUrl({ require_tld: false })
  url: string;

  @IsNumber()
  @IsOptional()
  orden?: number;
}

export class CreateProductoDto {
  @IsString()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsNumber()
  precio: number;

  @IsNumber()
  @IsOptional()
  precioOferta?: number;

  @IsBoolean()
  @IsOptional()
  enOferta?: boolean;

  @IsBoolean()
  @IsOptional()
  esNuevo?: boolean;

  @IsBoolean()
  @IsOptional()
  esDestacado?: boolean;

  @IsNumber()
  @IsOptional()
  stock?: number;

  @IsNumber()
  @IsOptional()
  stockMinimo?: number;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  imagenUrl?: string;

  @IsNumber()
  @IsOptional()
  categoriaId?: number;

  @IsNumber()
  @IsOptional()
  subcategoriaId?: number;

  @IsNumber()
  tiendaId: number;

  @IsNumber()
  @IsOptional()
  proveedorId?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImagenProductoDto)
  @IsOptional()
  imagenes?: ImagenProductoDto[];
}
