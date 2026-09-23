import { Controller, Post, Get, Body, Param, Req, Headers, UnauthorizedException, HttpCode, UseGuards, ParseIntPipe, RawBodyRequest, BadRequestException } from '@nestjs/common';
import { SuscripcionService } from './suscripcion.service';
import { SinSuscripcion } from 'src/common/decorators/sin-suscripcion.decorator';
import { PagoVerificadorService } from './pago-verificador.service';
import * as crypto from 'crypto';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@SinSuscripcion()
@Controller()
export class SuscripcionController {
  constructor(
    private readonly suscripcionService: SuscripcionService,
    private readonly pagoVerificador: PagoVerificadorService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('tiendas/:id/suscripcion/checkout')
  async checkout(
    @Param('id', ParseIntPipe) id: number,
    @Body('planId', ParseIntPipe) planId: number,
    @Body('meses', ParseIntPipe) meses: number,
    @Req() req: any
  ) {
    if (meses <= 0 || meses > 24) {
      throw new BadRequestException('La cantidad de meses debe ser entre 1 y 24');
    }

    const userId = req.user.id;
    const userStores = await this.suscripcionService.getUserStores(userId);
    if (!userStores.find(store => store.id === id)) {
      throw new UnauthorizedException('No tienes permiso para generar pagos para esta tienda');
    }

    const checkout = await this.suscripcionService.createCheckout(id, planId, meses);
    // Solo ahora empieza a consultarse la pasarela, y solo por 2 min
    this.pagoVerificador.programar(checkout.idempotencyKey);
    return checkout;
  }

  @UseGuards(JwtAuthGuard)
  @Get('tiendas/:id/suscripcion/estado/:idempotencyKey')
  async status(
    @Param('id', ParseIntPipe) id: number,
    @Param('idempotencyKey') idempotencyKey: string,
    @Req() req: any
  ) {
    const userId = req.user.id;
    const userStores = await this.suscripcionService.getUserStores(userId);
    if (!userStores.find(store => store.id === id)) {
      throw new UnauthorizedException('No tienes permiso para consultar esta tienda');
    }

    const pago = await this.suscripcionService.getStatus(idempotencyKey);
    if (pago.tiendaId !== id) {
      throw new UnauthorizedException('El pago no pertenece a esta tienda');
    }
    return pago;
  }

  @UseGuards(JwtAuthGuard)
  @Post('tiendas/:id/suscripcion/verificar/:idempotencyKey')
  @HttpCode(200)
  async verificar(
    @Param('id', ParseIntPipe) id: number,
    @Param('idempotencyKey') idempotencyKey: string,
    @Req() req: any
  ) {
    const userId = req.user.id;
    const userStores = await this.suscripcionService.getUserStores(userId);
    if (!userStores.find(store => store.id === id)) {
      throw new UnauthorizedException('No tienes permiso para consultar esta tienda');
    }

    const pago = await this.suscripcionService.verificarPago(idempotencyKey);
    if (!pago || pago.tiendaId !== id) {
      throw new UnauthorizedException('El pago no pertenece a esta tienda');
    }
    return pago;
  }

  @Post('pagos/webhook/banco')
  @HttpCode(200)
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-signature') signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new UnauthorizedException('No raw body');
    }

    const secret = process.env.BANCO_WEBHOOK_SECRET;
    if (!secret) {
        throw new Error('Falta BANCO_WEBHOOK_SECRET');
    }

    const firmaEsperada = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('base64');

    // Manejar caso donde signature no viene o Buffer.from falla
    if (!signature) {
      throw new UnauthorizedException('Falta firma');
    }

    let valido = false;
    try {
        valido = crypto.timingSafeEqual(
        Buffer.from(firmaEsperada),
        Buffer.from(signature),
        );
    } catch(e) {
        // Ignorar si los buffers tienen diferente tamaño (timingSafeEqual arroja error)
    }

    if (!valido) {
      throw new UnauthorizedException('Firma inválida');
    }

    const body = JSON.parse(rawBody.toString('utf8'));
    if (body.eventType === 'QR_PAYMENT_COMPLETED' && body.status === 'EXITO') {
      await this.suscripcionService.processWebhook(body.transactionId);
    }
    
    return { received: true };
  }
}
