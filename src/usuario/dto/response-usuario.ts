// src/users/dto/user-response.dto.ts
import { Exclude, Expose } from 'class-transformer';
import { Rol } from 'src/common/rol.enum';


export class UserResponseDto {
  @Expose()
  id: number;

  @Expose()
  email: string;

  @Expose()
  nombre: string;

  @Expose()
  apellido?: string;

  @Expose()
  rol: Rol;

  @Expose()
  activo: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Exclude()
  password: string;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
