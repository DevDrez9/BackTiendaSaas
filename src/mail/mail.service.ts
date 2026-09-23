import { Injectable, Logger } from '@nestjs/common';

/**
 * Envío de correos con Brevo (antes Sendinblue): plan gratis de 300 correos/día,
 * sin tarjeta, y permite enviar desde un correo verificado sin tener dominio propio.
 * Se usa su API HTTP con fetch, así no hace falta instalar ninguna librería.
 *
 * Variables de entorno:
 *   BREVO_API_KEY    -> Brevo > SMTP & API > API Keys
 *   MAIL_FROM_EMAIL  -> remitente verificado en Brevo (Senders)
 *   MAIL_FROM_NAME   -> nombre que ve el cliente (ej. "micatalogo")
 *
 * Sin BREVO_API_KEY (desarrollo) el correo NO se envía: se imprime en la consola.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async enviar(para: string, asunto: string, html: string): Promise<boolean> {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      this.logger.warn(`[DEV] Correo a ${para} | ${asunto}\n${html.replace(/<[^>]+>/g, ' ')}`);
      return true;
    }

    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          sender: {
            email: process.env.MAIL_FROM_EMAIL,
            name: process.env.MAIL_FROM_NAME || 'micatalogo',
          },
          to: [{ email: para }],
          subject: asunto,
          htmlContent: html,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        this.logger.error(`Brevo respondió ${res.status}: ${await res.text()}`);
        return false;
      }
      return true;
    } catch (error) {
      this.logger.error(`Error enviando correo a ${para}`, error as any);
      return false;
    }
  }

  /** Plantilla simple y consistente para todos los correos. */
  plantilla(titulo: string, cuerpoHtml: string) {
    return `
      <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
        <h2 style="margin:0 0 16px;color:#3b82f6">${titulo}</h2>
        ${cuerpoHtml}
        <p style="margin-top:32px;font-size:12px;color:#64748b">micatalogo · Este es un correo automático, no respondas a este mensaje.</p>
      </div>`;
  }
}
