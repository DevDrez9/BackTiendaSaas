export class ImagenProductoResponseDto {
  id: number;
  url: string;
  orden: number;
  productoId: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ImagenProductoResponseDto>) {
    Object.assign(this, partial);
  }
}
