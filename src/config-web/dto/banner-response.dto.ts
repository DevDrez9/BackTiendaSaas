export class BannerResponseDto {
  id: number;
  url: string;
  orden: number;
  titulo?: string;
  subtitulo?: string;
  enlace?: string;
  configWebId: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<BannerResponseDto>) {
    Object.assign(this, partial);
  }
}
