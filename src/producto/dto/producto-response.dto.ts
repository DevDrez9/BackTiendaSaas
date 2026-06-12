import { Exclude } from 'class-transformer';

export class ProductoResponseDto {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  precioOferta?: number;
  enOferta: boolean;
  esNuevo: boolean;
  esDestacado: boolean;
  stock: number;
  stockMinimo: number;
  sku?: string;
  imagenUrl?: string;
  categoriaId: number;
  subcategoriaId?: number;
  tiendaId: number;
  proveedorId?: number;
  createdAt: Date;
  updatedAt: Date;
  imagenes?: any[];
  categoria?: any;
  subcategoria?: any;
  tienda?: any;
  proveedor?: any;

  @Exclude()
  movimientoInventario?: any[];

  @Exclude()
  carritoItem?: any[];

  @Exclude()
  ventaItems?: any[];

  constructor(partial: Partial<ProductoResponseDto>) {
    Object.assign(this, partial);
  }
}
