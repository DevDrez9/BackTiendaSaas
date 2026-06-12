import { IsOptional, IsNumber, IsString, IsDateString } from 'class-validator';

export class FilterVentasDto {
  @IsNumber()
  @IsOptional()
  tiendaId?: number;

  @IsString()
  @IsOptional()
  estado?: string;

  @IsString()
  @IsOptional()
  metodoPago?: string;

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
