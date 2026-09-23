import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma.service';
import { MailService } from 'src/mail/mail.service';

const DIA_MS = 24 * 60 * 60 * 1000;
const AVISOS_DIAS = [7, 3, 1]; // días antes del vencimiento

/**
 * Una vez al día avisa por correo a los dueños cuya suscripción está por vencer
 * (7, 3 y 1 día antes) y a los que se les venció en las últimas 24h.
 * Como corre una vez al día, cada tienda cae en cada ventana una sola vez: no hay duplicados.
 * Es una sola consulta liviana por ventana: no carga el backend.
 */
@Injectable()
export class AvisosVencimientoService {
  private readonly logger = new Logger(AvisosVencimientoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  // 13:00 UTC = 09:00 en Bolivia
  @Cron('0 13 * * *', { timeZone: 'UTC' })
  async enviarAvisos() {
    const ahora = Date.now();
    const appUrl = process.env.FRONTEND_URL?.split(',')[0] || '';

    for (const dias of AVISOS_DIAS) {
      const desde = new Date(ahora + (dias - 1) * DIA_MS);
      const hasta = new Date(ahora + dias * DIA_MS);
      await this.avisar(desde, hasta, (t) => ({
        asunto: dias === 1 ? `Tu tienda ${t} vence mañana` : `Tu tienda ${t} vence en ${dias} días`,
        cuerpo: `<p>La suscripción de <strong>${t}</strong> vence ${dias === 1 ? 'mañana' : `en ${dias} días`}.</p>
                 <p>Renueva para que tu catálogo siga visible y puedas seguir recibiendo pedidos.</p>`,
      }), appUrl);
    }

    // Vencidas en las últimas 24h
    await this.avisar(new Date(ahora - DIA_MS), new Date(ahora), (t) => ({
      asunto: `Tu tienda ${t} está pausada`,
      cuerpo: `<p>La suscripción de <strong>${t}</strong> venció y tu catálogo ya no es visible para tus clientes.</p>
               <p>Tus productos y configuración siguen guardados: renueva y todo vuelve a estar en línea al instante.</p>`,
    }), appUrl);
  }

  private async avisar(
    desde: Date,
    hasta: Date,
    contenido: (tienda: string) => { asunto: string; cuerpo: string },
    appUrl: string,
  ) {
    const tiendas = await this.prisma.tienda.findMany({
      where: { planId: { not: null }, suscripcionFin: { gte: desde, lt: hasta } },
      select: {
        nombre: true,
        usuarios: { select: { usuario: { select: { email: true, nombre: true, activo: true } } } },
      },
    });

    for (const tienda of tiendas) {
      const { asunto, cuerpo } = contenido(tienda.nombre);
      for (const { usuario } of tienda.usuarios) {
        if (!usuario.activo) continue;
        await this.mail.enviar(
          usuario.email,
          asunto,
          this.mail.plantilla(asunto, `<p>Hola ${usuario.nombre},</p>${cuerpo}
            ${appUrl ? `<p style="margin-top:24px"><a href="${appUrl}/dashboard/suscripcion"
              style="background:#3b82f6;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">
              Renovar suscripción</a></p>` : ''}`),
        );
      }
    }
    if (tiendas.length) this.logger.log(`Avisos enviados: ${tiendas.length} tienda(s) (${desde.toISOString()} - ${hasta.toISOString()})`);
  }
}
