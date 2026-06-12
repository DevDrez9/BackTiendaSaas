import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { TipoMovimiento } from 'src/common/tipo-movimiento.enum';

export class CreateMovimientoInventarioDto {
 @IsEnum(TipoMovimiento)
  tipo: TipoMovimiento;

  @IsNumber()
  cantidad: number;

  @IsNumber()
  productoId: number;

  @IsString()
  @IsOptional()
  motivo?: string;

  @IsNumber()
  @IsOptional()
  usuarioId?: number;

  @IsNumber()
  @IsOptional()
  compraId?: number;

  @IsNumber()
  @IsOptional()
  ventaId?: number;
}
