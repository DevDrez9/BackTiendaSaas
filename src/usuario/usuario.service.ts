import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { PrismaService } from 'src/prisma.service';
import { UserResponseDto } from './dto/response-usuario';
import { AssignStoreDto } from './dto/asignar-tienda.dto';
import * as bcrypt from 'bcrypt';
import { UserMapper } from './mappers/user.mapper';

@Injectable()
export class UsuarioService {
  constructor(private prisma: PrismaService) {}

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

 async create(createUserDto: CreateUsuarioDto) {
    const { email, password, ...rest } = createUserDto;

    const existingUser = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('El usuario ya existe');
    }

    const hashedPassword = await this.hashPassword(password);

    const user = await this.prisma.usuario.create({
      data: {
        email,
        password: hashedPassword,
        ...rest,
      },
    });

    return UserMapper.toResponseDto(user);
  }

   async findAll() {
    const users = await this.prisma.usuario.findMany({
      include: {
        tiendas: {
          include: {
            tienda: true,
          },
        },
      },
    });

    return users.map(user => UserMapper.toResponseDtoWithStores(user));
  }

  async findOne(id: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { id },
      include: {
        tiendas: {
          include: {
            tienda: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return UserMapper.toResponseDtoWithStores(user);
  }

  async findByEmail(email: string) {
    return this.prisma.usuario.findUnique({
      where: { email },
    });
  }

   async update(id: number, updateUserDto: UpdateUsuarioDto) {
    const { password, ...rest } = updateUserDto;

    let data: any = { ...rest };

    if (password) {
      data.password = await this.hashPassword(password);
    }

    try {
      const user = await this.prisma.usuario.update({
        where: { id },
        data,
      });

      return UserMapper.toResponseDto(user);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Usuario no encontrado');
      }
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.prisma.usuario.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Usuario no encontrado');
      }
      throw error;
    }
  }

  async assignStore(userId: number, assignStoreDto: AssignStoreDto): Promise<void> {
    const { tiendaId } = assignStoreDto;

    // Check if user exists
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Check if store exists
    const store = await this.prisma.tienda.findUnique({
      where: { id: tiendaId },
    });

    if (!store) {
      throw new NotFoundException('Tienda no encontrada');
    }

    // Check if assignment already exists
    const existingAssignment = await this.prisma.usuarioTienda.findUnique({
      where: {
        usuarioId_tiendaId: {
          usuarioId: userId,
          tiendaId: tiendaId,
        },
      },
    });

    if (existingAssignment) {
      throw new ConflictException('El usuario ya está asignado a esta tienda');
    }

    await this.prisma.usuarioTienda.create({
      data: {
        usuarioId: userId,
        tiendaId: tiendaId,
      },
    });
  }

  async removeStore(userId: number, tiendaId: number): Promise<void> {
    try {
      await this.prisma.usuarioTienda.delete({
        where: {
          usuarioId_tiendaId: {
            usuarioId: userId,
            tiendaId: tiendaId,
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Asignación no encontrada');
      }
      throw error;
    }
  }

  async getUserStores(userId: number) {
    const userWithStores = await this.prisma.usuario.findUnique({
      where: { id: userId },
      include: {
        tiendas: {
          include: {
            tienda: true,
          },
        },
      },
    });

    if (!userWithStores) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return userWithStores.tiendas.map(usuarioTienda => usuarioTienda.tienda);
  }

   async validateUser(email: string, password: string) {
    const user = await this.findByEmail(email);
    
    if (user && await bcrypt.compare(password, user.password)) {
      return UserMapper.toResponseDto(user);
    }
    
    return null;
  }
}
