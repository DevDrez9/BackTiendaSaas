# Despliegue

## 1. Antes del primer despliegue (en tu PC)

```bash
npm install
npx prisma migrate dev --name recuperacion_password   # crea la migración de CodigoRecuperacion y regenera el cliente
npm run build                                           # debe compilar sin errores
```

Sube a git la carpeta `prisma/migrations` nueva.

## 2. Servidor

```bash
cp .env.example .env      # completar TODAS las variables
docker compose up -d --build
docker compose logs -f backend
```

- `http://TU_SERVIDOR:3000/health` debe responder `{"status":"ok"}`.
- Nunca uses `docker compose down -v`: `-v` borra la base de datos y las imágenes.

### Si la base de datos ya existía y se creó con `prisma db push`

`migrate deploy` falla con el error P3005 (la base no está vacía). Marca como aplicadas las migraciones que ya existen en esa base (una por una, en orden) y luego despliega:

```bash
docker compose run --rm backend npx prisma migrate resolve --applied 20250801165945_init
# ...repite con cada carpeta de prisma/migrations que YA esté reflejada en la base...
docker compose run --rm backend npx prisma migrate deploy
```

## 3. Correo (Brevo, gratis)

1. Crea una cuenta en https://www.brevo.com (plan Free: 300 correos/día).
2. Ve a **Senders, Domains & Dedicated IPs → Senders** y verifica tu correo remitente.
3. Ve a **SMTP & API → API Keys** y crea una clave.
4. Completa `BREVO_API_KEY` y `MAIL_FROM_EMAIL` en `.env`.

Sin `BREVO_API_KEY`, los correos no se envían: el código aparece en los logs del backend (sirve para desarrollo).

## 4. Respaldos

- Base de datos: `./backups/db` (diario 03:00 UTC, se guardan los últimos 7).
- Imágenes: `./backups/uploads` (diario, se guardan los últimos 7).
- Copia `./backups` fuera del servidor de vez en cuando (Drive, S3, tu PC).

Restaurar la base:
```bash
gunzip < backups/db/ARCHIVO.sql.gz | docker compose exec -T db mysql -uroot -p"$MYSQL_ROOT_PASSWORD" tienda
```

## 5. Monitoreo gratis

Registra `https://tu-api/health` en https://uptimerobot.com (gratis): te avisa por correo si el backend o la base se caen.
