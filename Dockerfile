# ---------- Etapa 1: build ----------
FROM node:20-alpine AS build
RUN apk add --no-cache openssl
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm install
RUN npx prisma generate

COPY . .
RUN npm run build

# ---------- Etapa 2: runtime ----------
FROM node:20-alpine
RUN apk add --no-cache openssl wget
WORKDIR /app
ENV NODE_ENV=production \
    UPLOADS_DIR=/app/uploads

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package*.json ./

# Carpeta de imágenes: se monta como volumen (ver docker-compose.yml) para que
# las imágenes sobrevivan a reinicios, rebuilds y actualizaciones del contenedor.
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads
VOLUME ["/app/uploads"]

# No correr como root
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- "http://localhost:${PORT:-3000}/health" || exit 1

# migrate deploy SOLO aplica migraciones pendientes (nunca borra datos, a diferencia de db push)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
