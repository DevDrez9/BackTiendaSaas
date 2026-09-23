# Actualizar el servidor (Ubuntu + MySQL en el host + Docker + cloudflared)

> Hazlo en un horario de poco tráfico. Tiempo total: unos 40 min, con 5-10 min de caída.
> Sigue el orden y NO avances si un paso falla. Reemplaza lo que está entre < >.

---------------------------------------------------------------------
## PASO 0 - En tu PC (Windows)
---------------------------------------------------------------------

```powershell
cd D:\Programacion\Nest\tienda
npx prisma migrate dev --name recuperacion_password
npm run build
git add . ; git commit -m "Actualizacion MVP" ; git push

cd D:\Programacion\React\mitienda
npm run build
git add . ; git commit -m "Actualizacion MVP" ; git push
```
Si `migrate dev` te ofrece hacer un **reset** de la base, responde **No** y avísame.

---------------------------------------------------------------------
## PASO 1 - Reconocer lo que corre hoy (servidor, solo lectura)
---------------------------------------------------------------------

```bash
# Contenedores actuales: anota nombres, imágenes y puertos
docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}"

# Variables del backend actual (DATABASE_URL, JWT_SECRET, etc.)
docker inspect <backend_viejo> --format '{{range .Config.Env}}{{println .}}{{end}}'

# Dónde guarda hoy las imágenes
docker inspect <backend_viejo> --format '{{json .Mounts}}'

# A qué puertos apunta el túnel
sudo cat /etc/cloudflared/config.yml 2>/dev/null || cat ~/.cloudflared/config.yml
```

Anota:
| Dato | Dónde lo ves | Ejemplo |
|---|---|---|
| Puerto del backend | `service:` del túnel para la API | `http://localhost:3000` |
| Puerto del frontend | `service:` del túnel para la web | `http://localhost:8080` |
| DATABASE_URL actual | `docker inspect ... Env` | `mysql://user:pass@172.17.0.1:3306/tienda` |
| JWT_SECRET actual | `docker inspect ... Env` | |
| Nombre de la base | final del DATABASE_URL | `tienda` |

Revisa qué tiendas quedarían ocultas con la nueva regla de suscripción:
```bash
mysql -u root -p <nombre_bd> -e "SELECT id, nombre, dominio, planId, suscripcionFin, activa FROM Tienda;"
```
Las que tengan `planId` o `suscripcionFin` en NULL (o una fecha pasada) dejarán de verse. Anótalas para el paso 9.

---------------------------------------------------------------------
## PASO 2 - Respaldos (obligatorio)
---------------------------------------------------------------------

```bash
R=~/respaldo-$(date +%F) && mkdir -p $R && cd $R

# 2.1 Base de datos
mysqldump -u root -p --single-transaction --routines --triggers <nombre_bd> | gzip > bd.sql.gz
ls -lh bd.sql.gz                                   # que NO pese 0

# 2.2 Imágenes: se copian desde el contenedor viejo (funciona sin importar cómo se guardaron)
docker cp <backend_viejo>:/app/uploads ./uploads
ls ./uploads | wc -l                               # cantidad de imágenes

# 2.3 Imágenes de Docker actuales, para volver atrás
docker tag $(docker inspect -f '{{.Image}}' <backend_viejo>)  tienda-backend:rollback
docker tag $(docker inspect -f '{{.Image}}' <frontend_viejo>) tienda-frontend:rollback
```

---------------------------------------------------------------------
## PASO 3 - Bajar el código nuevo
---------------------------------------------------------------------

Las dos carpetas deben estar una al lado de la otra (el compose busca el frontend en `../mitienda`):
```
~/apps/tienda      <- backend (aquí está docker-compose.yml)
~/apps/mitienda    <- frontend
```
```bash
cd ~/apps/tienda   && git pull
cd ~/apps/mitienda && git pull
cd ~/apps/tienda
```
Si tu frontend está en otra ruta, edita `build.context` en `docker-compose.yml`.

---------------------------------------------------------------------
## PASO 4 - Configurar el .env
---------------------------------------------------------------------

```bash
cp .env.example .env
nano .env
```

| Variable | Valor |
|---|---|
| `DATABASE_URL` | La actual, pero con host **127.0.0.1** (el backend ahora usa la red del servidor). Ej: `mysql://user:pass@127.0.0.1:3306/tienda` |
| `PORT` | El puerto del backend al que apunta el túnel (paso 1) |
| `FRONTEND_PORT` | El puerto del frontend al que apunta el túnel (paso 1) |
| `JWT_SECRET` | El actual **si tiene 32 caracteres o más**. Si es más corto, genera uno: `openssl rand -hex 48` (todos deberán volver a iniciar sesión, nada más) |
| `APP_URL` | URL pública de la API por el túnel, ej. `https://api.tudominio.com` |
| `FRONTEND_URL` | URL pública de la web, ej. `https://tudominio.com` (si no coincide, CORS bloquea todo) |
| `TRUST_PROXY` | `1` |
| `SWAGGER_ENABLED` | `false` |
| `BANCO_*` | Los mismos de ahora |
| `BREVO_API_KEY`, `MAIL_FROM_EMAIL` | De tu cuenta Brevo (ver DESPLIEGUE.md). Vacío = el código sale en los logs |
| `UPLOADS_VOLUME_NAME` | `tienda_uploads` |

```bash
chmod 600 .env
docker compose config > /dev/null && echo "compose OK"
```

Comprueba que MySQL acepta conexión por 127.0.0.1 con ese usuario:
```bash
mysql -h 127.0.0.1 -u <usuario> -p <nombre_bd> -e "SELECT 1;"
```
Si falla con "Access denied", el usuario solo existe para otro host (ej. `'user'@'172.17.%'`). Créalo para localhost:
```sql
CREATE USER '<usuario>'@'127.0.0.1' IDENTIFIED BY '<password>';
GRANT ALL PRIVILEGES ON <nombre_bd>.* TO '<usuario>'@'127.0.0.1';
FLUSH PRIVILEGES;
```

---------------------------------------------------------------------
## PASO 5 - Construir (el sitio sigue funcionando mientras tanto)
---------------------------------------------------------------------

```bash
docker compose build
```
Tarda varios minutos. Si falla, el sitio actual no se ve afectado: corrige y repite.

---------------------------------------------------------------------
## PASO 6 - Cargar las imágenes en el volumen nuevo
---------------------------------------------------------------------

```bash
docker volume create tienda_uploads
docker run --rm -v tienda_uploads:/dst -v ~/respaldo-$(date +%F)/uploads:/src:ro alpine \
  sh -c "cp -a /src/. /dst/ && chown -R 1000:1000 /dst && ls /dst | wc -l"
```
Debe mostrar la misma cantidad del paso 2.2. (`1000` es el usuario `node` con el que corre el backend nuevo.)

---------------------------------------------------------------------
## PASO 7 - Preparar la base de datos (solo esta vez)
---------------------------------------------------------------------

Hasta ahora la base se actualizaba con `db push`. Desde ahora se usan migraciones. Esto no toca los contenedores viejos: el sitio sigue arriba.

```bash
cd ~/apps/tienda

# 7.1 Ver qué le falta a la base real
docker compose run --rm --no-deps backend sh -c \
  'npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script' > cambios.sql
cat cambios.sql
```
**Revisa `cambios.sql`.** Debe tener solo `CREATE TABLE`, `ADD COLUMN`, `CREATE INDEX` o `ADD CONSTRAINT` (como mínimo la tabla `CodigoRecuperacion`).
**Si ves `DROP TABLE`, `DROP COLUMN` o `MODIFY`, DETENTE** y mándame el archivo.

```bash
# 7.2 Aplicar los cambios (solo agregan: el backend viejo sigue funcionando)
docker compose run --rm --no-deps -v "$PWD/cambios.sql":/app/cambios.sql backend \
  npx prisma db execute --file cambios.sql --schema prisma/schema.prisma

# 7.3 Registrar el historial de migraciones como aplicado
for m in $(ls prisma/migrations | grep -v migration_lock); do
  docker compose run --rm --no-deps backend npx prisma migrate resolve --applied "$m"
done

# 7.4 Comprobar: debe decir "Database schema is up to date!"
docker compose run --rm --no-deps backend npx prisma migrate status
```
En las próximas actualizaciones ya no harás este paso: las migraciones nuevas se aplican solas al arrancar.

---------------------------------------------------------------------
## PASO 8 - Cambiar a la versión nueva (aquí empieza la caída)
---------------------------------------------------------------------

```bash
# 8.1 Detener lo viejo (NO lo borres todavía: es tu plan B)
docker stop <backend_viejo> <frontend_viejo>
docker update --restart=no <backend_viejo> <frontend_viejo>   # que no revivan si se reinicia el servidor

# 8.2 Levantar lo nuevo
docker compose up -d

# 8.3 Verificar
docker compose ps                                    # backend: "healthy" (espera ~40 s)
docker compose logs --tail=50 backend                # sin errores
curl -s http://localhost:<PORT>/health               # {"status":"ok","db":"ok",...}
curl -sI http://localhost:<FRONTEND_PORT> | head -1  # HTTP/1.1 200 OK
```
Si usas los mismos puertos que antes, cloudflared no necesita cambios. Si cambiaste algún puerto, edita su `config.yml` y:
```bash
sudo systemctl restart cloudflared
```

---------------------------------------------------------------------
## PASO 9 - Probar el sitio real (desde el navegador)
---------------------------------------------------------------------

- [ ] Se ven las imágenes de los productos
- [ ] Iniciar sesión con una cuenta existente
- [ ] **Admin → asignar plan y meses** a las tiendas de clientes que anotaste en el paso 1
- [ ] El catálogo público de esas tiendas se ve
- [ ] Cambiar el estado de un pedido
- [ ] Configuración → cambiar el dominio de una tienda de prueba
- [ ] "¿Olvidaste tu contraseña?" → llega el código
- [ ] Generar un QR de suscripción (no hace falta pagarlo)

---------------------------------------------------------------------
## PASO 10 - Respaldos automáticos
---------------------------------------------------------------------

```bash
# Credenciales para mysqldump sin escribir la contraseña en scripts
cat > ~/.my.cnf <<'CNF'
[client]
user=root
password=<password_root_mysql>
CNF
chmod 600 ~/.my.cnf

chmod +x ~/apps/tienda/scripts/backup-db.sh
~/apps/tienda/scripts/backup-db.sh <nombre_bd>      # prueba manual: debe decir OK

crontab -e
# agrega esta línea (todos los días a las 3:00):
0 3 * * * $HOME/apps/tienda/scripts/backup-db.sh <nombre_bd> >> $HOME/apps/tienda/backups/db/backup.log 2>&1
```
Las imágenes ya se respaldan solas (servicio `backup-uploads`) en `~/apps/tienda/backups/uploads`.

---------------------------------------------------------------------
## SI ALGO SALE MAL - volver atrás (2 minutos)
---------------------------------------------------------------------

```bash
cd ~/apps/tienda
docker compose down                        # SIN -v
docker update --restart=unless-stopped <backend_viejo> <frontend_viejo>
docker start <backend_viejo> <frontend_viejo>
```
El paso 7 solo agregó tablas y columnas, así que la versión vieja funciona igual con la base actual.
Restaurar la base (solo si de verdad hace falta):
```bash
gunzip < ~/respaldo-<FECHA>/bd.sql.gz | mysql -u root -p <nombre_bd>
```

---------------------------------------------------------------------
## PASO 11 - Limpieza (una semana después, si todo va bien)
---------------------------------------------------------------------

```bash
docker rm <backend_viejo> <frontend_viejo>
docker image prune
```

---------------------------------------------------------------------
## Próximas actualizaciones (ya con todo esto montado)
---------------------------------------------------------------------

```bash
~/apps/tienda/scripts/backup-db.sh <nombre_bd>
cd ~/apps/tienda && git pull && cd ../mitienda && git pull && cd ../tienda
docker compose build
docker compose up -d          # aplica migraciones nuevas y reinicia
docker compose logs -f backend
```
