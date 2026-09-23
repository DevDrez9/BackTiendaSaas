import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { EstadoPago } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { SuscripcionService } from './suscripcion.service';

const INTERVALO_MS = 20_000;       // consulta a la pasarela cada 20s
const VENTANA_MS = 2 * 60_000;     // solo durante los 2 primeros minutos del QR
const CONCURRENCIA = 5;            // máximo de consultas simultáneas a la pasarela

/**
 * Verifica en la pasarela solo los QR recién generados.
 * - No hay nada corriendo mientras no haya QR pendientes.
 * - Un único temporizador compartido para todos los QR (no uno por usuario).
 * - Cada QR se deja de consultar a los 2 min, o antes si se paga / llega el webhook.
 */
@Injectable()
export class PagoVerificadorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PagoVerificadorService.name);
  private readonly pendientes = new Map<string, number>(); // idempotencyKey -> vence (ms)
  private timer: NodeJS.Timeout | null = null;
  private ejecutando = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly suscripcionService: SuscripcionService,
  ) {}

  /** Llamar justo después de generar un QR. */
  programar(idempotencyKey: string, desde = Date.now()) {
    this.pendientes.set(idempotencyKey, desde + VENTANA_MS);
    if (!this.timer) {
      this.timer = setInterval(() => void this.tick(), INTERVALO_MS);
    }
  }

  /** Si el backend se reinicia, retoma los QR que aún estaban dentro de su ventana. */
  async onModuleInit() {
    const desde = new Date(Date.now() - VENTANA_MS);
    const recientes = await this.prisma.pagoSuscripcion.findMany({
      where: { estado: EstadoPago.PENDIENTE, createdAt: { gte: desde } },
      select: { idempotencyKey: true, createdAt: true },
    });
    recientes.forEach(p => this.programar(p.idempotencyKey, p.createdAt.getTime()));
  }

  onModuleDestroy() {
    this.detener();
  }

  private detener() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private async tick() {
    if (this.ejecutando) return; // evita solapar ticks si la pasarela está lenta
    this.ejecutando = true;
    try {
      const ahora = Date.now();
      for (const [key, vence] of this.pendientes) {
        if (vence <= ahora) this.pendientes.delete(key);
      }

      const keys = [...this.pendientes.keys()];
      for (let i = 0; i < keys.length; i += CONCURRENCIA) {
        const lote = keys.slice(i, i + CONCURRENCIA);
        await Promise.all(
          lote.map(async key => {
            try {
              const pago = await this.suscripcionService.verificarPago(key);
              if (!pago || pago.estado !== EstadoPago.PENDIENTE) {
                this.pendientes.delete(key); // resuelto: pagado / expirado / cancelado
              }
            } catch (error) {
              this.logger.error(`Error verificando ${key}`, error);
            }
          }),
        );
      }
    } finally {
      this.ejecutando = false;
      if (this.pendientes.size === 0) this.detener();
    }
  }
}
