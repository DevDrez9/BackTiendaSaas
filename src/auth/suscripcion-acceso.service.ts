import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Rol } from 'src/common/rol.enum';

const CACHE_MS = 60_000;

/**
 * Regla única de "¿esta cuenta puede usar el panel?".
 * Solo se cachean los resultados POSITIVOS (máx. 60s y nunca más allá del vencimiento),
 * así quien acaba de pagar entra al instante y no se consulta la BD en cada request.
 */
@Injectable()
export class SuscripcionAccesoService {
  private readonly cache = new Map<number, number>(); // userId -> válido hasta (ms)

  constructor(private readonly prisma: PrismaService) {}

  async tieneSuscripcionActiva(userId: number, rol?: string): Promise<boolean> {
    if (rol === Rol.ADMIN || rol === Rol.MANAGER) return true;
    if (!userId) return false;

    const ahora = Date.now();
    const hasta = this.cache.get(userId);
    if (hasta && hasta > ahora) return true;

    const vinculo = await this.prisma.usuarioTienda.findFirst({
      where: {
        usuarioId: userId,
        tienda: { planId: { not: null }, suscripcionFin: { gt: new Date() } },
      },
      select: { tienda: { select: { suscripcionFin: true } } },
      orderBy: { tienda: { suscripcionFin: 'desc' } },
    });

    if (!vinculo?.tienda.suscripcionFin) {
      this.cache.delete(userId);
      return false;
    }

    const vence = vinculo.tienda.suscripcionFin.getTime();
    this.cache.set(userId, Math.min(ahora + CACHE_MS, vence));
    if (this.cache.size > 10_000) this.limpiar(ahora);
    return true;
  }

  /** Llamar si se quita/cambia el plan de alguien para que el cambio aplique al instante. */
  invalidar(userId?: number) {
    if (userId === undefined) this.cache.clear();
    else this.cache.delete(userId);
  }

  private limpiar(ahora: number) {
    for (const [k, v] of this.cache) if (v <= ahora) this.cache.delete(k);
  }
}
