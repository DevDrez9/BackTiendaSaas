import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

/**
 * Palabras que no pueden ser dominio porque chocan con rutas de la app
 * (el catálogo vive en /:dominio) o se prestan a suplantación.
 */
const RESERVADOS = new Set([
  'admin', 'api', 'app', 'dashboard', 'login', 'register', 'registro', 'recuperar',
  'pagar-suscripcion', 'producto', 'productos', 'tienda', 'tiendas', 'uploads', 'static',
  'assets', 'www', 'mail', 'soporte', 'ayuda', 'help', 'support', 'blog', 'precios',
  'planes', 'terminos', 'privacidad', 'micatalogo', 'health', 'webhook', 'pagos',
]);

const FORMATO = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/; // 3 a 40 caracteres

export interface ResultadoDominio {
  dominio: string;
  disponible: boolean;
  motivo?: string;
}

@Injectable()
export class DominioService {
  constructor(private readonly prisma: PrismaService) {}

  /** "Mi Tiénda  Ñandú!" -> "mi-tienda-nandu" */
  normalizar(texto: string): string {
    return (texto || '')
      .normalize('NFD').replace(/[̀-ͯ]/g, '') // quita tildes
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40)
      .replace(/-$/, '');
  }

  /** Clave de similitud: sin guiones. "mi-tienda" y "mitienda" se consideran el mismo. */
  private clave(dominio: string) {
    return dominio.replace(/-/g, '');
  }

  async verificar(texto: string, excluirTiendaId?: number): Promise<ResultadoDominio> {
    const dominio = this.normalizar(texto);

    if (!FORMATO.test(dominio)) {
      return { dominio, disponible: false, motivo: 'Debe tener entre 3 y 40 caracteres: letras, números y guiones' };
    }
    if (RESERVADOS.has(dominio) || RESERVADOS.has(this.clave(dominio))) {
      return { dominio, disponible: false, motivo: 'Ese nombre está reservado' };
    }

    const similares = await this.prisma.$queryRaw<{ id: number }[]>(Prisma.sql`
      SELECT id FROM Tienda
      WHERE REPLACE(dominio, '-', '') = ${this.clave(dominio)}
      ${excluirTiendaId ? Prisma.sql`AND id <> ${excluirTiendaId}` : Prisma.empty}
      LIMIT 1
    `);
    if (similares.length > 0) {
      return { dominio, disponible: false, motivo: 'Ya existe una tienda con ese nombre o uno muy parecido' };
    }
    return { dominio, disponible: true };
  }

  /** Lanza error si no se puede usar. Devuelve el dominio normalizado. */
  async validar(texto: string, excluirTiendaId?: number): Promise<string> {
    const r = await this.verificar(texto, excluirTiendaId);
    if (!r.disponible) {
      if (r.motivo?.startsWith('Ya existe')) throw new ConflictException(r.motivo);
      throw new BadRequestException(r.motivo);
    }
    return r.dominio;
  }

  /** Para el registro: genera un dominio libre a partir del nombre (mitienda, mitienda-2, ...). */
  async generarUnico(nombre: string): Promise<string> {
    let base = this.normalizar(nombre);
    if (base.length < 3) base = `tienda-${base}`.replace(/-$/, '');
    base = base.slice(0, 34).replace(/-$/, '');

    for (let i = 1; i <= 50; i++) {
      const candidato = i === 1 ? base : `${base}-${i}`;
      if ((await this.verificar(candidato)).disponible) return candidato;
    }
    return `${base}-${Date.now().toString(36)}`;
  }
}
