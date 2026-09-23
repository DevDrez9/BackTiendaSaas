// src/auth/auth.service.ts
import { BadRequestException, ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { LoginUserDto } from 'src/usuario/dto/login-usuario.dto';
import { UsuarioService } from 'src/usuario/usuario.service';
import { PrismaService } from 'src/prisma.service';
import { SuscripcionAccesoService } from './suscripcion-acceso.service';
import { DominioService } from 'src/tienda/dominio.service';
import { MailService } from 'src/mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/recuperacion.dto';

const CODIGO_VALIDEZ_MIN = 15;
const CODIGO_MAX_INTENTOS = 5;
const CODIGO_ESPERA_REENVIO_MS = 60_000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsuarioService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private suscripcionAcceso: SuscripcionAccesoService,
    private dominioService: DominioService,
    private mailService: MailService,
  ) {}

  async login(loginUserDto: LoginUserDto) {
    const user = await this.usersService.validateUser(
      loginUserDto.email?.trim().toLowerCase(),
      loginUserDto.password,
    );

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    if (user.activo === false) {
      throw new UnauthorizedException('Tu cuenta está desactivada. Contacta a soporte.');
    }

    const payload = {
      email: user.email,
      sub: user.id,
      rol: user.rol,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: user,
      suscripcionActiva: await this.tieneSuscripcionActiva(user.id, user.rol),
    };
  }

  tieneSuscripcionActiva(userId: number, rol?: string) {
    return this.suscripcionAcceso.tieneSuscripcionActiva(userId, rol);
  }

  /**
   * Crea usuario + configuración + tienda + vínculo en UNA transacción:
   * o se crea todo, o no se crea nada (no quedan usuarios "huérfanos").
   */
  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const nombre = dto.nombre.trim();

    const existe = await this.prisma.usuario.findUnique({ where: { email } });
    if (existe) {
      throw new ConflictException('Ya existe una cuenta con ese correo');
    }

    const dominio = await this.dominioService.generarUnico(nombre);
    const passwordHash = await bcrypt.hash(dto.password, 10);

    try {
      await this.prisma.$transaction(async (tx) => {
        const user = await tx.usuario.create({
          data: { email, password: passwordHash, nombre, rol: 'USER' }, // nadie se registra como ADMIN
        });

        const configWeb = await tx.configWeb.create({
          data: { nombreSitio: nombre, colorPrimario: '#0043ce', colorSecundario: '#ffffff' },
        });

        // Sin plan: la tienda no se publica hasta que pague (ver tienda-vigente.ts)
        const tienda = await tx.tienda.create({
          data: { nombre, dominio, configWebId: configWeb.id },
        });

        await tx.usuarioTienda.create({
          data: { usuarioId: user.id, tiendaId: tienda.id },
        });
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        // Carrera: otro registro tomó el mismo correo o dominio al mismo tiempo
        throw new ConflictException('No se pudo crear la cuenta, intenta nuevamente');
      }
      throw error;
    }

    return this.login({ email, password: dto.password } as LoginUserDto);
  }

  // ---------------------------------------------------------------------------
  // Recuperación de contraseña con código de 6 dígitos por correo
  // ---------------------------------------------------------------------------

  private hashCodigo(codigo: string) {
    return crypto
      .createHmac('sha256', process.env.JWT_SECRET || 'codigo-recuperacion')
      .update(codigo)
      .digest('hex');
  }

  /** Siempre responde lo mismo, exista o no el correo (no revela qué correos están registrados). */
  async forgotPassword(dto: ForgotPasswordDto) {
    const respuesta = { message: 'Si el correo está registrado, te enviamos un código de 6 dígitos.' };
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.usuario.findUnique({ where: { email } });
    if (!user || user.activo === false) return respuesta;

    // Anti-spam: un código por minuto por cuenta
    const ultimo = await this.prisma.codigoRecuperacion.findFirst({
      where: { usuarioId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    if (ultimo && Date.now() - ultimo.createdAt.getTime() < CODIGO_ESPERA_REENVIO_MS) {
      return respuesta;
    }

    const codigo = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');

    await this.prisma.$transaction([
      // Invalida códigos anteriores sin usar
      this.prisma.codigoRecuperacion.updateMany({
        where: { usuarioId: user.id, usadoEn: null },
        data: { usadoEn: new Date() },
      }),
      this.prisma.codigoRecuperacion.create({
        data: {
          usuarioId: user.id,
          codigoHash: this.hashCodigo(codigo),
          expiraEn: new Date(Date.now() + CODIGO_VALIDEZ_MIN * 60_000),
        },
      }),
    ]);

    await this.mailService.enviar(
      user.email,
      `Tu código de recuperación: ${codigo}`,
      this.mailService.plantilla(
        'Recupera tu contraseña',
        `<p>Hola ${user.nombre},</p>
         <p>Usa este código para crear una nueva contraseña:</p>
         <p style="font-size:32px;font-weight:800;letter-spacing:8px;margin:24px 0">${codigo}</p>
         <p>Vence en ${CODIGO_VALIDEZ_MIN} minutos. Si no lo pediste, ignora este correo: tu contraseña no cambiará.</p>`,
      ),
    );

    return respuesta;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const invalido = new BadRequestException('Código inválido o vencido');
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.usuario.findUnique({ where: { email } });
    if (!user) throw invalido;

    const registro = await this.prisma.codigoRecuperacion.findFirst({
      where: { usuarioId: user.id, usadoEn: null, expiraEn: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!registro || registro.intentos >= CODIGO_MAX_INTENTOS) throw invalido;

    const esperado = Buffer.from(registro.codigoHash, 'hex');
    const recibido = Buffer.from(this.hashCodigo(dto.codigo), 'hex');
    const coincide = esperado.length === recibido.length && crypto.timingSafeEqual(esperado, recibido);

    if (!coincide) {
      const actualizado = await this.prisma.codigoRecuperacion.update({
        where: { id: registro.id },
        data: { intentos: { increment: 1 } },
      });
      if (actualizado.intentos >= CODIGO_MAX_INTENTOS) {
        throw new BadRequestException('Demasiados intentos. Solicita un nuevo código.');
      }
      throw invalido;
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    await this.prisma.$transaction([
      this.prisma.usuario.update({ where: { id: user.id }, data: { password: passwordHash } }),
      this.prisma.codigoRecuperacion.updateMany({
        where: { usuarioId: user.id, usadoEn: null },
        data: { usadoEn: new Date() },
      }),
    ]);

    this.logger.log(`Contraseña restablecida para usuario ${user.id}`);
    return { message: 'Contraseña actualizada. Ya puedes iniciar sesión.' };
  }
}
