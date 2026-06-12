import { IsString, IsOptional, IsBoolean, IsEmail } from 'class-validator';

export class CreateProveedorDto {
  @IsString()
  nombre: string;

  @IsString()
  @IsOptional()
  contacto?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsOptional()
  ruc?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
