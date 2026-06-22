import { ProductoResponseDto } from '../dto/producto-response.dto';

export class ProductoMapper {
  static toResponseDto(producto: any): ProductoResponseDto {
    const response = new ProductoResponseDto({
      id: producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion || undefined,
      precio: Number(producto.precio),
      precioOferta: producto.precioOferta ? Number(producto.precioOferta) : undefined,
      enOferta: producto.enOferta,
      esNuevo: producto.esNuevo,
      esDestacado: producto.esDestacado,
      stock: producto.stock,
      stockMinimo: producto.stockMinimo,
      sku: producto.sku || undefined,
      imagenUrl: producto.imagenUrl || undefined,
      categoriaId: producto.categoriaId,
      subcategoriaId: producto.subcategoriaId || undefined,
      tiendaId: producto.tiendaId,
      proveedorId: producto.proveedorId || undefined,
      createdAt: producto.createdAt,
      updatedAt: producto.updatedAt,
    });

    // Agregar relaciones si existen
    if (producto.imagenes) {
      Object.assign(response, { 
        imagenes: producto.imagenes.map((img: any) => ({
          id: img.id,
          url: img.url,
          orden: img.orden
        }))
      });
    }

    if (producto.categoria) {
      Object.assign(response, { 
        categoria: {
          id: producto.categoria.id,
          nombre: producto.categoria.nombre
        }
      });
    }

    if (producto.subcategoria) {
      Object.assign(response, { 
        subcategoria: {
          id: producto.subcategoria.id,
          nombre: producto.subcategoria.nombre
        }
      });
    }

    if (producto.tienda) {
      Object.assign(response, { 
        tienda: {
          id: producto.tienda.id,
          nombre: producto.tienda.nombre,
          dominio: producto.tienda.dominio,
          plan: producto.tienda.plan,
          ciudad: producto.tienda.ciudad,
          configWeb: producto.tienda.configWeb
        }
      });
    }

    if (producto.proveedor) {
      Object.assign(response, { 
        proveedor: {
          id: producto.proveedor.id,
          nombre: producto.proveedor.nombre
        }
      });
    }

    return response;
  }
}
