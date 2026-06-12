import { IsNumber, IsString, IsOptional, IsEnum } from 'class-validator';
import { TipoMovimiento } from 'src/common/tipo-movimiento.enum';

export class UpdateStockDto {
  @IsNumber()
  cantidad: number;

  @IsString()
  @IsOptional()
  motivo?: string;

   @IsEnum(TipoMovimiento)
  tipo: TipoMovimiento;

  

}
