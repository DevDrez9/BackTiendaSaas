import { SetMetadata } from '@nestjs/common';

export const SIN_SUSCRIPCION_KEY = 'sinSuscripcion';

/**
 * Marca una ruta (o un controlador completo) como accesible aunque la cuenta
 * NO tenga una suscripción pagada. Úsalo solo en: login/registro, el flujo de pago,
 * lo mínimo que necesita la pantalla de pago y los endpoints públicos del catálogo.
 * Todo lo que no lleve este decorador exige suscripción vigente (a los USER).
 */
export const SinSuscripcion = () => SetMetadata(SIN_SUSCRIPCION_KEY, true);
