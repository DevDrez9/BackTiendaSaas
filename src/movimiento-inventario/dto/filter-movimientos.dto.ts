import { IsOptional, IsNumber, IsString, IsDateString, IsEnum } from 'class-validator';
import { TipoMovimiento } from 'src/common/tipo-movimiento.enum';


export class FilterMovimientosDto {
  @IsNumber()
  @IsOptional()
  productoId?: number;

  @IsEnum(TipoMovimiento)
  @IsOptional()
  tipo?: TipoMovimiento;

  @IsNumber()
  @IsOptional()
  usuarioId?: number;

  @IsNumber()
  @IsOptional()
  compraId?: number;

  @IsNumber()
  @IsOptional()
  ventaId?: number;

  @IsDateString()
  @IsOptional()
  fechaInicio?: string;

  @IsDateString()
  @IsOptional()
  fechaFin?: string;

  @IsNumber()
  @IsOptional()
  page?: number;

  @IsNumber()
  @IsOptional()
  limit?: number;
}
