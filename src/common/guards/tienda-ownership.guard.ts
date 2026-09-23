import { Injectable, CanActivate, ExecutionContext, ForbiddenException, BadRequestException } from '@nestjs/common';
import { TiendaService } from 'src/tienda/tienda.service';

@Injectable()
export class TiendaOwnershipGuard implements CanActivate {
  constructor(private readonly tiendaService: TiendaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Usuario no autenticado.');
    }

    if (user.rol === 'ADMIN') {
      return true; 
    }

    // Try to get tiendaId from params or body
    let tiendaId = request.params.id || request.params.tiendaId || request.body.tiendaId;
    
    if (!tiendaId) {
      // If we don't know the store id, let it pass (maybe it's a creation route that doesn't need it or will validate later)
      // or we can be strict and throw error. Let's be strict if this guard is applied.
      throw new BadRequestException('Falta ID de tienda (tiendaId o id)');
    }

    tiendaId = parseInt(tiendaId, 10);
    if (isNaN(tiendaId)) {
        throw new BadRequestException('ID de tienda inválido');
    }

    const userStores = await this.tiendaService.findByUserId(user.id);
    const ownsStore = userStores.some(store => store.id === tiendaId);

    if (!ownsStore) {
      throw new ForbiddenException('No tienes permiso para acceder a esta tienda.');
    }

    return true;
  }
}
