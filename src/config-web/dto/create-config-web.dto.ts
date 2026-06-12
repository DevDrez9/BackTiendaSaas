import { Type } from "class-transformer";
import { IsArray, IsHexColor, IsNumber, IsOptional, IsString, IsUrl, ValidateNested } from "class-validator";

class BannerDto {
  @IsUrl()
  url: string;

  @IsOptional()
  orden?: number;

  @IsString()
  @IsOptional()
  titulo?: string;

  @IsString()
  @IsOptional()
  subtitulo?: string;

  @IsUrl()
  @IsOptional()
  enlace?: string;
}

export class CreateConfigWebDto {
  @IsString()
  nombreSitio: string;

  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  colorPrimario: string;

  @IsString()
  colorSecundario: string;

  @IsString()
  @IsOptional()
  whatsapp?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BannerDto)
  @IsOptional()
  banners?: BannerDto[];
}
