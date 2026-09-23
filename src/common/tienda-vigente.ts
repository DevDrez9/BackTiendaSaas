import { NotFoundException } from '@nestjs/common';

/**
 * Una tienda se muestra al público solo si está activa y tiene un plan pagado y vigente.
 * Misma regla en todo el backend: usar estas funciones en vez de repetir la condición.
 */
export const tiendaVigenteWhere = () => ({
  activa: true,
  planId: { not: null },
  suscripcionFin: { gt: new Date() },
});

export function esTiendaVigente(
  tienda?: { activa?: boolean | null; planId?: number | null; suscripcionFin?: Date | null } | null,
): boolean {
  return !!tienda
    && tienda.activa !== false
    && tienda.planId != null
    && !!tienda.suscripcionFin
    && new Date(tienda.suscripcionFin) > new Date();
}

/** 404 a propósito: al público no se le revela si la tienda existe pero no pagó. */
export class TiendaNoDisponibleException extends NotFoundException {
  constructor() {
    super({
      statusCode: 404,
      code: 'TIENDA_NO_DISPONIBLE',
      message: 'Esta tienda no está disponible en este momento',
    });
  }
}

export function asegurarTiendaVigente<T extends Parameters<typeof esTiendaVigente>[0]>(tienda: T): NonNullable<T> {
  if (!esTiendaVigente(tienda)) throw new TiendaNoDisponibleException();
  return tienda as NonNullable<T>;
}
