import { IsNotEmpty, IsString, IsInt, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePlanDto {
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Type(() => Number) // Asegura que el valor sea un número entero
  nivel: number; // 1, 2, 3, 4, 5...

  @IsOptional()
  @IsNumber()
  @Type(() => Number) // Para manejar Decimal de Prisma (aunque el DTO usa Number)
  precioMensual?: number;
}
