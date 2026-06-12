FROM node:20-alpine

# Instalar openssl requerido por Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm install

# Generar cliente de Prisma
RUN npx prisma generate

# Copiar el resto del código
COPY . .

# Compilar la aplicación NestJS
RUN npm run build

EXPOSE 3000

# Ejecutar push de base de datos (sincronizar schema) y luego iniciar la app
CMD ["sh", "-c", "npx prisma db push && npm run start:prod"]
