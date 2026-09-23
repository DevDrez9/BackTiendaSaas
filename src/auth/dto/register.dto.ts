import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(80)
  nombre: string;

  @IsEmail({}, { message: 'Correo inválido' })
  @MaxLength(120)
  email: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(72) // bcrypt ignora lo que pase de 72 bytes
  password: string;
}
