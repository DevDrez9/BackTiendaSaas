import { Injectable, CanActivate, ExecutionContext, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ResourceOwnershipGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Usuario no autenticado.');
    }

    if (user.rol === 'ADMIN') {
      return true; 
    }

    const path = request.route.path; // e.g. "/producto/:id"
    const method = request.method; // POST, PATCH, DELETE, GET
    
    // 1. Extraer tiendaId si viene directamente
    let tiendaId = request.body?.tiendaId || request.query?.tiendaId || request.params?.tiendaId;

    // Helper function to extract param
    const getParam = (name: string) => request.params?.[name] ? parseInt(request.params[name], 10) : null;
    const paramId = getParam('id');
    const productoId = getParam('productoId') || request.body?.productoId || request.query?.productoId;
    const categoriaId = getParam('categoriaId') || request.body?.categoriaId || request.query?.categoriaId;
    const compraId = getParam('compraId') || request.body?.compraId || request.query?.compraId;
    const ventaId = getParam('ventaId') || request.body?.ventaId || request.query?.ventaId;
    const imagenId = getParam('imagenId');

    // 2. Si no hay tiendaId, deducirlo del recurso principal
    if (!tiendaId) {
      if (path.includes('/producto/imagenes') && imagenId) {
         const img = await this.prisma.imagenProducto.findUnique({ where: { id: imagenId }, include: { producto: true } });
         if (img) tiendaId = img.producto.tiendaId;
      }
      else if (path.includes('/producto') && paramId && !path.includes('/categoria') && !path.includes('/subcategoria')) {
        const prod = await this.prisma.producto.findUnique({ where: { id: paramId }});
        if (prod) tiendaId = prod.tiendaId;
      } else if (productoId) {
        const prod = await this.prisma.producto.findUnique({ where: { id: parseInt(productoId, 10) }});
        if (prod) tiendaId = prod.tiendaId;
      }
      else if (path.includes('subcategorias') && paramId) { // PATCH/DELETE subcategoria/:id
         const subc = await this.prisma.subcategoria.findUnique({ where: { id: paramId }, include: { categoria: true } });
         if (subc && subc.categoria) tiendaId = subc.categoria.tiendaId;
      }
      else if (path.includes('/categoria') && paramId) {
        const cat = await this.prisma.categoria.findUnique({ where: { id: paramId }});
        if (cat) tiendaId = cat.tiendaId;
      } else if (categoriaId) {
        const cat = await this.prisma.categoria.findUnique({ where: { id: parseInt(categoriaId, 10) }});
        if (cat) tiendaId = cat.tiendaId;
      }
      else if (path.includes('compras') && paramId) {
        const compra = await this.prisma.compraProveedor.findUnique({ where: { id: paramId }, include: { movimientos: true } });
        // Compras can be tricky, let's assume they don't have direct tiendaId but checking ProveedorTienda
      }
      else if (path.includes('/venta') && paramId) {
        const venta = await this.prisma.venta.findUnique({ where: { id: paramId }});
        if (venta) tiendaId = venta.tiendaId;
      } else if (ventaId) {
        const venta = await this.prisma.venta.findUnique({ where: { id: parseInt(ventaId, 10) }});
        if (venta) tiendaId = venta.tiendaId;
      }
      else if (path.includes('/tiendas') && paramId) {
        tiendaId = paramId; 
      }
    }

    if (path.includes('/proveedor')) {
       let provId = paramId;
       if (path.includes('compras') && paramId) {
          const comp = await this.prisma.compraProveedor.findUnique({ where: { id: paramId } });
          if (comp) provId = comp.proveedorId;
       }
       if (provId) {
          const userStores = await this.prisma.usuarioTienda.findMany({ where: { usuarioId: user.id }});
          const storeIds = userStores.map(us => us.tiendaId);
          const provTienda = await this.prisma.proveedorTienda.findFirst({
              where: { proveedorId: provId, tiendaId: { in: storeIds } }
          });
          if (!provTienda) throw new ForbiddenException('No tienes permiso para este proveedor.');
          return true; // Acceso concedido al proveedor
       }
    }

    if (!tiendaId) {
      // Si a pesar de todo no hay tiendaId, lo dejamos pasar asumiendo que el controlador lo manejará (ej. listar genérico sin tienda)
      return true; 
    }

    tiendaId = parseInt(tiendaId, 10);
    
    // Verificamos propiedad de la tienda
    const userStore = await this.prisma.usuarioTienda.findUnique({
        where: {
            usuarioId_tiendaId: {
                usuarioId: user.id,
                tiendaId: tiendaId
            }
        }
    });

    if (!userStore) {
      throw new ForbiddenException('No tienes permiso sobre este recurso.');
    }

    return true;
  }
}
