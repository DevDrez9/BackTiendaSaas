// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from 'src/usuario/dto/login-usuario.dto';
import { UsuarioService } from 'src/usuario/usuario.service';
import { PrismaService } from 'src/prisma.service';


@Injectable()
export class AuthService {
  constructor(
    private usersService: UsuarioService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async login(loginUserDto: LoginUserDto) {
    const user = await this.usersService.validateUser(
      loginUserDto.email,
      loginUserDto.password,
    );

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { 
      email: user.email, 
      sub: user.id,
      rol: user.rol 
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: user,
    };
  }

  async register(createUserDto: any) {
    // Forzamos el rol a USER para que nadie pueda registrarse como ADMIN
    const user = await this.usersService.create({
      ...createUserDto,
      rol: 'USER',
    });

    const dominioBase = createUserDto.nombre.toLowerCase().replace(/[^a-z0-9]/g, '');
    let dominio = dominioBase;
    
    // ConfigWeb base
    const configWeb = await this.prisma.configWeb.create({
      data: {
        nombreSitio: createUserDto.nombre,
        colorPrimario: '#0043ce',
        colorSecundario: '#ffffff',
      }
    });

    // Create the store
    const tienda = await this.prisma.tienda.create({
      data: {
        nombre: createUserDto.nombre,
        dominio: dominio + Math.floor(Math.random() * 1000), // Randomize slightly to avoid domain clashes for simple demo
        configWebId: configWeb.id,
        // planId is intentionally null so they don't have a subscription yet
      }
    });

    // Link user and store
    await this.prisma.usuarioTienda.create({
      data: {
        usuarioId: user.id,
        tiendaId: tienda.id,
      }
    });

    return this.login({
      email: createUserDto.email,
      password: createUserDto.password,
    });
  }
}
