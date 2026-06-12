import { IsNumber, IsOptional, IsString, IsArray, ValidateNested, IsDateString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoCompra } from 'src/common/estado-compra.enum';

class CompraItemDto {
  @IsNumber()
  productoId: number;

  @IsNumber()
  cantidad: number;

  @IsNumber()
  precio: number;
}

export class CreateCompraDto {
  @IsNumber()
  proveedorId: number;

  @IsString()
  @IsOptional()
  numeroCompra?: string;

   @IsEnum(EstadoCompra)
  @IsOptional()
  estado?: string;

  @IsNumber()
  @IsOptional()
  subtotal?: number;

  @IsNumber()
  @IsOptional()
  impuestos?: number;

  @IsDateString()
  @IsOptional()
  fechaEntrega?: Date;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompraItemDto)
  items: CompraItemDto[];
}
