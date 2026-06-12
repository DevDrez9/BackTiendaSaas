import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  MinLength,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTiendaDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsNotEmpty()
  @IsString()
  // Expresión regular para un subdominio/slug simple (solo letras minúsculas, números y guiones)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'El dominio solo puede contener letras minúsculas, números y guiones.',
  })
  dominio: string;

  @IsNotEmpty({ message: 'Se requiere el ID de la configuración web (configWebId).' })
  @IsInt()
  @Type(() => Number)
  configWebId: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  planId?: number; // Opcional, una tienda puede crearse sin un plan inicial

  @IsOptional()
  @IsBoolean()
  activa?: boolean = true;
}
