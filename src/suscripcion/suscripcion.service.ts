import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { TiendaService } from 'src/tienda/tienda.service';
import { PlanService } from 'src/plan/plan.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { EstadoPago } from '@prisma/client';

const MIN_ENTRE_VERIFICACIONES_MS = 15_000;

@Injectable()
export class SuscripcionService {
  private readonly logger = new Logger(SuscripcionService.name);
  private readonly ultimaVerificacion = new Map<string, number>();

  constructor(
    private prisma: PrismaService,
    private tiendaService: TiendaService,
    private planService: PlanService,
    private httpService: HttpService,
  ) {}

  async createCheckout(tiendaId: number, planId: number, meses: number) {
    const plan = await this.planService.findOne(planId);
    if (!plan) throw new NotFoundException('Plan no encontrado');

    // Bajar de plan: no se permite si la tienda tiene más productos de los que el plan nuevo admite.
    // Así nunca queda una tienda "pasada" del límite; el dueño decide qué productos borrar antes.
    const tienda = await this.prisma.tienda.findUnique({
      where: { id: tiendaId },
      select: { limiteProductosPersonalizado: true, _count: { select: { productos: true } } },
    });
    if (!tienda) throw new NotFoundException('Tienda no encontrada');
    const limite = tienda.limiteProductosPersonalizado ?? plan.limiteProductos;
    if (limite !== -1 && tienda._count.productos > limite) {
      throw new BadRequestException(
        `El plan ${plan.nombre} permite hasta ${limite} productos y tu tienda tiene ${tienda._count.productos}. ` +
        `Elimina ${tienda._count.productos - limite} producto(s) o elige un plan mayor.`,
      );
    }

    const monto = Number(plan.precioMensual) * meses;
    const idempotencyKey = `sub-${tiendaId}-${Date.now()}`;
    const expirationMinutes = 30;

    const pago = await this.prisma.pagoSuscripcion.create({
      data: {
        tiendaId,
        planId,
        meses,
        monto,
        idempotencyKey,
        estado: EstadoPago.PENDIENTE,
      },
    });

    const apiKey = process.env.BANCO_GATEWAY_API_KEY;
    const gatewayUrl = process.env.BANCO_GATEWAY_URL;
    
    if (!apiKey || !gatewayUrl) {
        throw new Error('Configuración de banco faltante');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${gatewayUrl}/qr/generate`,
          {
            amount: monto,
            expirationMinutes,
            idempotencyKey,
            description: `Suscripción plan ${plan.nombre} x${meses} mes(es) - Tienda #${tiendaId}`,
          },
          {
            headers: { 'X-API-KEY': apiKey },
          }
        )
      );

      const qrData = response.data.respuesta;

      await this.prisma.pagoSuscripcion.update({
        where: { id: pago.id },
        data: {
          bankQrId: qrData.bankQrId,
          qrImageBase64: qrData.qrImageBase64,
          expiraEn: new Date(qrData.expirationDate),
        },
      });

      return {
        idempotencyKey,
        qrImageBase64: qrData.qrImageBase64,
        expiraEn: qrData.expirationDate,
      };
    } catch (error) {
      this.logger.error('Error generando QR', error);
      throw error;
    }
  }

  /**
   * Consulta liviana (solo BD, sin la imagen del QR). Es la que usa el frontend
   * para hacer polling, así que no toca la pasarela.
   */
  async getStatus(idempotencyKey: string) {
    const pago = await this.prisma.pagoSuscripcion.findUnique({
      where: { idempotencyKey },
      select: { id: true, tiendaId: true, estado: true, expiraEn: true, pagadoEn: true },
    });
    if (!pago) throw new NotFoundException('Pago no encontrado');

    // Expiración perezosa: se marca al consultarlo, sin cron
    if (pago.estado === EstadoPago.PENDIENTE && pago.expiraEn && pago.expiraEn < new Date()) {
      await this.prisma.pagoSuscripcion.updateMany({
        where: { id: pago.id, estado: EstadoPago.PENDIENTE },
        data: { estado: EstadoPago.EXPIRADO },
      });
      return { ...pago, estado: EstadoPago.EXPIRADO };
    }
    return pago;
  }

  async processWebhook(transactionId: string) {
    return this.prisma.$transaction(async (prisma) => {
      const pago = await prisma.pagoSuscripcion.findUnique({
        where: { idempotencyKey: transactionId },
      });

      if (!pago) {
        throw new NotFoundException('Pago no encontrado');
      }

      // Update condicional: solo pasa a PAGADO si sigue PENDIENTE.
      // Evita renovar dos veces si webhook, cron y verificación manual llegan a la vez.
      const { count } = await prisma.pagoSuscripcion.updateMany({
        where: { id: pago.id, estado: EstadoPago.PENDIENTE },
        data: {
          estado: EstadoPago.PAGADO,
          pagadoEn: new Date(),
        },
      });

      if (count === 0) {
        return; // Idempotencia: ya fue procesado (o ya no está pendiente)
      }

      await this.tiendaService.renewSubscription(pago.tiendaId, pago.planId, pago.meses);
    });
  }

  /**
   * Consulta a la pasarela (que a su vez consulta al banco) el estado real del QR.
   * Si está pagado, acredita el pago localmente aunque el webhook nunca haya llegado.
   */
  async verificarPago(idempotencyKey: string) {
    const pago = await this.prisma.pagoSuscripcion.findUnique({
      where: { idempotencyKey },
    });
    if (!pago) throw new NotFoundException('Pago no encontrado');

    if (pago.estado !== EstadoPago.PENDIENTE) {
      return this.getStatus(idempotencyKey);
    }

    // Anti-spam: como máximo una consulta a la pasarela cada 15s por QR,
    // aunque el usuario presione "Verificar" muchas veces o coincida con el verificador.
    const ultima = this.ultimaVerificacion.get(idempotencyKey) ?? 0;
    if (Date.now() - ultima < MIN_ENTRE_VERIFICACIONES_MS) {
      return this.getStatus(idempotencyKey);
    }
    this.ultimaVerificacion.set(idempotencyKey, Date.now());
    this.limpiarVerificacionesViejas();

    const apiKey = process.env.BANCO_GATEWAY_API_KEY;
    const gatewayUrl = process.env.BANCO_GATEWAY_URL;

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${gatewayUrl}/qr/sync/${idempotencyKey}`,
          {},
          { headers: { 'X-API-KEY': apiKey } },
        ),
      );

      const estadoPasarela = response.data?.respuesta?.status;

      if (estadoPasarela === 'PAID') {
        await this.processWebhook(idempotencyKey);
      } else if (estadoPasarela === 'CANCELLED') {
        await this.prisma.pagoSuscripcion.updateMany({
          where: { id: pago.id, estado: EstadoPago.PENDIENTE },
          data: { estado: EstadoPago.CANCELADO },
        });
      }
    } catch (error) {
      this.logger.error(`Error verificando pago ${idempotencyKey}`, error);
    }

    // Marcar como expirado si ya venció y sigue pendiente
    if (pago.expiraEn && pago.expiraEn < new Date()) {
      await this.prisma.pagoSuscripcion.updateMany({
        where: { id: pago.id, estado: EstadoPago.PENDIENTE },
        data: { estado: EstadoPago.EXPIRADO },
      });
    }

    return this.getStatus(idempotencyKey);
  }

  private limpiarVerificacionesViejas() {
    if (this.ultimaVerificacion.size < 1000) return;
    const limite = Date.now() - MIN_ENTRE_VERIFICACIONES_MS;
    for (const [k, t] of this.ultimaVerificacion) {
      if (t < limite) this.ultimaVerificacion.delete(k);
    }
  }

  async getUserStores(userId: number) {
    return this.tiendaService.findByUserId(userId);
  }
}
