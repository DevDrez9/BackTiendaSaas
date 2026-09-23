import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const esProduccion = process.env.NODE_ENV === 'production';

  // Sin secreto JWT la app firmaría tokens con "undefined": mejor no arrancar
  if (!process.env.JWT_SECRET || (esProduccion && process.env.JWT_SECRET.length < 32)) {
    throw new Error('JWT_SECRET no está configurado (en producción debe tener al menos 32 caracteres)');
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });

  // Detrás de nginx / Cloudflare: usar la IP real del cliente (rate limit por IP correcto)
  if (process.env.TRUST_PROXY) {
    const valor = process.env.TRUST_PROXY;
    app.set('trust proxy', /^\d+$/.test(valor) ? Number(valor) : valor);
  }
  app.disable('x-powered-by');

  app.enableCors({
    origin: (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map(o => o.trim()),
    credentials: true,
  });

  // Swagger solo en desarrollo (o si se habilita explícitamente)
  const swaggerHabilitado = process.env.SWAGGER_ENABLED
    ? process.env.SWAGGER_ENABLED === 'true'
    : !esProduccion;
  if (swaggerHabilitado) {
    const config = new DocumentBuilder()
      .setTitle('Tienda SaaS API')
      .setDescription('API para la gestión del backend multi-tenant de Tienda SaaS')
      .setVersion('1.0')
      .addTag('tiendas')
      .addBearerAuth()
      .build();
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, documentFactory);
    logger.log('Swagger habilitado en /api');
  }

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
