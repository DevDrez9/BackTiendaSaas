import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { SIN_SUSCRIPCION_KEY } from 'src/common/decorators/sin-suscripcion.decorator';
import { SuscripcionAccesoService } from '../suscripcion-acceso.service';

/**
 * Guard GLOBAL (registrado como APP_GUARD): cerrado por defecto.
 * Cualquier request autenticada de un USER sin suscripción vigente recibe 403,
 * salvo en rutas marcadas con @SinSuscripcion(). Así, un endpoint nuevo queda
 * protegido automáticamente aunque alguien olvide ponerle el guard.
 *
 * Los guards globales corren antes que los de cada ruta (req.user aún no existe),
 * por eso aquí se lee el JWT directamente. Si no hay token o es inválido, se deja
 * pasar: la ruta pública responde normal y la privada la rechaza su JwtAuthGuard.
 */
@Injectable()
export class SuscripcionActivaGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly acceso: SuscripcionAccesoService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;

    const exenta = this.reflector.getAllAndOverride<boolean>(SIN_SUSCRIPCION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (exenta) return true;

    const req = context.switchToHttp().getRequest();
    const auth: string | undefined = req.headers?.authorization;
    if (!auth?.startsWith('Bearer ')) return true;

    let payload: any;
    try {
      payload = this.jwtService.verify(auth.slice(7));
    } catch {
      return true; // token inválido/expirado: lo rechaza el JwtAuthGuard de la ruta
    }

    const activa = await this.acceso.tieneSuscripcionActiva(Number(payload.sub), payload.rol);
    if (!activa) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'SUSCRIPCION_REQUERIDA',
        message: 'Necesitas una suscripción activa para usar esta función',
      });
    }
    return true;
  }
}
