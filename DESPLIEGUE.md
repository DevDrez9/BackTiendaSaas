# Despliegue

## 1. Antes del primer despliegue (en tu PC)

```bash
npm install
npx prisma migrate dev --name recuperacion_password   # crea la migración de CodigoRecuperacion y regenera el cliente
npm run build                                           # debe compilar sin errores
```

Sube a git la carpeta `prisma/migrations` nueva.

## 2. Servidor

Sigue la guía paso a paso de **ACTUALIZACION.md** (MySQL en el servidor + Docker + cloudflared).

## 3. Correo (Brevo, gratis)

1. Crea una cuenta en https://www.brevo.com (plan Free: 300 correos/día).
2. Ve a **Senders, Domains & Dedicated IPs → Senders** y verifica tu correo remitente.
3. Ve a **SMTP & API → API Keys** y crea una clave.
4. Completa `BREVO_API_KEY` y `MAIL_FROM_EMAIL` en `.env`.

Sin `BREVO_API_KEY`, los correos no se envían: el código aparece en los logs del backend (sirve para desarrollo).

## 4. Respaldos

- Base de datos: `scripts/backup-db.sh` con cron (ver ACTUALIZACION.md, paso 10). Se guardan los últimos 7 días en `backups/db`.
- Imágenes: servicio `backup-uploads` del compose. Se guardan los últimos 7 días en `backups/uploads`.
- Copia la carpeta `backups` fuera del servidor de vez en cuando (Drive, S3 o tu PC).

## 5. Monitoreo gratis

Registra `https://tu-api/health` en https://uptimerobot.com (gratis): te avisa por correo si el backend o la base se caen.
