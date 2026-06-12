import { IsEmail, IsString, IsOptional, IsEnum, IsBoolean, MinLength } from 'class-validator';
import { Rol } from 'src/common/rol.enum';



export class CreateUsuarioDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  nombre: string;

  @IsString()
  @IsOptional()
  apellido?: string;

  @IsEnum(Rol)
  @IsOptional()
  rol?: Rol;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
