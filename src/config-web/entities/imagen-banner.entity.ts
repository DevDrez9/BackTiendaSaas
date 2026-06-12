import { ConfigWeb } from "./config-web.entity";

export class ImagenBanner {
  id: number;
  url: string;
  orden: number;
  titulo?: string;
  subtitulo?: string;
  enlace?: string;
  configWebId: number;
  createdAt: Date;
  updatedAt: Date;
  configWeb?: ConfigWeb;
}
