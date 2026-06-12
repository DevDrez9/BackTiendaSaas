import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoVenta } from 'src/common/estado-venta.enum';
import { MetodoPago } from 'src/common/metodo-pago.enum';


class VentaItemDto {
  @IsNumber()
  productoId: number;

  @IsNumber()
  cantidad: number;

  @IsNumber()
  precio: number;
}

export class CreateVentaDto {
  @IsString()
  cliente: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsEnum(EstadoVenta)
  @IsOptional()
  estado?: EstadoVenta;

  @IsNumber()
  @IsOptional()
  subtotal?: number;

  @IsNumber()
  @IsOptional()
  impuestos?: number;

  @IsEnum(MetodoPago)
  @IsOptional()
  metodoPago?: MetodoPago;

  @IsNumber()
  tiendaId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VentaItemDto)
  items: VentaItemDto[];
}
