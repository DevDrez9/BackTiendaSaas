// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { JwtStrategy } from './strategies/jwt.strategy';
import { UsuarioModule } from 'src/usuario/usuario.module';
import { PrismaService } from 'src/prisma.service';
import { APP_GUARD } from '@nestjs/core';
import { SuscripcionAccesoService } from './suscripcion-acceso.service';
import { DominioService } from 'src/tienda/dominio.service';
import { SuscripcionActivaGuard } from './guards/suscripcion-activa.guard';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET as string,
      signOptions: { expiresIn: '24h' },
    }),
     UsuarioModule,
  ],
  providers: [
    AuthService,
    JwtStrategy,
    PrismaService,
    SuscripcionAccesoService,
    DominioService,
    // Exige suscripción vigente en TODAS las rutas salvo las marcadas con @SinSuscripcion()
    { provide: APP_GUARD, useClass: SuscripcionActivaGuard },
  ],
  controllers: [AuthController],
  exports: [AuthService, SuscripcionAccesoService],
})
export class AuthModule {}
