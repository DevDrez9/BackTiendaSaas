import { Usuario } from "@prisma/client";
import { UserResponseDto } from "../dto/response-usuario";
import { Rol } from "src/common/rol.enum";

export class UserMapper {
  static toResponseDto(user: Usuario): UserResponseDto {
    return new UserResponseDto({
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido || undefined,
      rol: user.rol as Rol,
      activo: user.activo,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  static toResponseDtoWithStores(user: any): UserResponseDto {
    return new UserResponseDto({
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido || undefined,
      rol: user.rol as Rol,
      activo: user.activo,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      // Si necesitas incluir tiendas en la respuesta
      ...(user.tiendas && { tiendas: user.tiendas })
    });
  }
}
