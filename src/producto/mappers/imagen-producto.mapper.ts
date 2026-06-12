import { ImagenProductoResponseDto } from '../dto/imagen-producto-response.dto';

export class ImagenProductoMapper {
  static toResponseDto(imagen: any): ImagenProductoResponseDto {
    return new ImagenProductoResponseDto({
      id: imagen.id,
      url: imagen.url,
      orden: imagen.orden,
      productoId: imagen.productoId,
      createdAt: imagen.createdAt,
      updatedAt: imagen.updatedAt,
    });
  }
}
