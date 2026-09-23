import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Lo único que el DUEÑO puede editar de su tienda.
 * (plan, límites, activa, suscripción y dominio van por sus propios endpoints)
 */
export class UpdateMiTiendaDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  ciudad?: string;
}

export class CambiarDominioDto {
  @IsString()
  @MinLength(3)
  @MaxLength(60)
  dominio: string;
}
