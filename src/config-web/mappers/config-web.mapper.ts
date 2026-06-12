
import { ConfigWeb, ImagenBanner } from "@prisma/client";
import { BannerResponseDto } from "../dto/banner-response.dto";
import { ConfigWebResponseDto } from "../dto/config-web-response.dto";


export class ConfigWebMapper {
  static toResponseDto(configWeb: ConfigWeb & { banners?: ImagenBanner[] }): ConfigWebResponseDto {
    const response = new ConfigWebResponseDto({
      id: configWeb.id,
      nombreSitio: configWeb.nombreSitio,
      logoUrl: configWeb.logoUrl || undefined,
      colorPrimario: configWeb.colorPrimario,
      colorSecundario: configWeb.colorSecundario,
      createdAt: configWeb.createdAt,
      updatedAt: configWeb.updatedAt,
    });

    if (configWeb.banners) {
      Object.assign(response, { 
        banners: configWeb.banners.map(banner => this.bannerToResponseDto(banner))
      });
    }

    return response;
  }

  static bannerToResponseDto(banner: ImagenBanner): BannerResponseDto {
    return new BannerResponseDto({
      id: banner.id,
      url: banner.url,
      orden: banner.orden,
      titulo: banner.titulo || undefined,
      subtitulo: banner.subtitulo || undefined,
      enlace: banner.enlace || undefined,
      configWebId: banner.configWebId,
      createdAt: banner.createdAt,
      updatedAt: banner.updatedAt,
    });
  }
}
