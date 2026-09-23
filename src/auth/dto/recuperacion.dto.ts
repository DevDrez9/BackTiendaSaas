import { IsEmail, IsString, Matches, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

const normalizarEmail = ({ value }: { value: any }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class ForgotPasswordDto {
  @Transform(normalizarEmail)
  @IsEmail({}, { message: 'Correo inválido' })
  email: string;
}

export class ResetPasswordDto {
  @Transform(normalizarEmail)
  @IsEmail({}, { message: 'Correo inválido' })
  email: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'El código debe tener 6 dígitos' })
  codigo: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(72)
  password: string;
}
