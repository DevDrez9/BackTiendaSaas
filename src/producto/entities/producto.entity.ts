import { ImagenProducto } from "./imagen-producto.entity";

export class Producto {
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
  imagenes?: ImagenProducto[];
  categoria?: any;
  subcategoria?: any;
  tienda?: any;
  proveedor?: any;
}
