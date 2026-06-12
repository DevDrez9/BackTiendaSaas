import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateConfigWebDto } from './dto/create-config-web.dto';
import { UpdateConfigWebDto } from './dto/update-config-web.dto';
import { ConfigWebMapper } from './mappers/config-web.mapper';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ConfigWebService {
 constructor(private prisma: PrismaService) {}

  async create(createConfigWebDto: CreateConfigWebDto) {
    const { banners, ...configData } = createConfigWebDto;

    const configWeb = await this.prisma.configWeb.create({
      data: {
        ...configData,
        banners: {
          create: banners?.map((banner, index) => ({
            ...banner,
            orden: banner.orden ?? index,
          })) || [],
        },
      },
      include: {
        banners: true,
      },
    });

    return ConfigWebMapper.toResponseDto(configWeb);
  }

  async findAll() {
    const configsWeb = await this.prisma.configWeb.findMany({
      include: {
        banners: {
          orderBy: { orden: 'asc' },
        },
        tiendas: true,
      },
    });

    return configsWeb.map(config => ConfigWebMapper.toResponseDto(config));
  }

  async findOne(id: number) {
    const configWeb = await this.prisma.configWeb.findUnique({
      where: { id },
      include: {
        banners: {
          orderBy: { orden: 'asc' },
        },
        tiendas: true,
      },
    });

    if (!configWeb) {
      throw new NotFoundException('ConfigWeb no encontrado');
    }

    return ConfigWebMapper.toResponseDto(configWeb);
  }

  async update(id: number, updateConfigWebDto: UpdateConfigWebDto) {
    const { banners, ...configData } = updateConfigWebDto;

    try {
      // Primero actualizar la configuración principal
      const configWeb = await this.prisma.configWeb.update({
        where: { id },
        data: configData,
        include: {
          banners: true,
        },
      });

      // Si hay banners para actualizar
      if (banners) {
        // Eliminar banners existentes
        await this.prisma.imagenBanner.deleteMany({
          where: { configWebId: id },
        });

        // Crear nuevos banners
        await this.prisma.imagenBanner.createMany({
          data: banners.map((banner, index) => ({
            ...banner,
            configWebId: id,
            orden: banner.orden ?? index,
          })),
        });

        // Obtener la configuración actualizada con los nuevos banners
        const updatedConfig = await this.prisma.configWeb.findUnique({
          where: { id },
          include: {
            banners: {
              orderBy: { orden: 'asc' },
            },
          },
        });

       
if (!updatedConfig) {
  throw new NotFoundException('ConfigWeb no encontrado después de la actualización');
}

return ConfigWebMapper.toResponseDto(updatedConfig);
      }

      return ConfigWebMapper.toResponseDto(configWeb);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('ConfigWeb no encontrado');
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      // Primero eliminar banners relacionados
      await this.prisma.imagenBanner.deleteMany({
        where: { configWebId: id },
      });

      // Luego eliminar la configuración
      await this.prisma.configWeb.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('ConfigWeb no encontrado');
      }
      throw error;
    }
  }

  async addBanner(configWebId: number, bannerData: any) {
    const configWeb = await this.prisma.configWeb.findUnique({
      where: { id: configWebId },
    });

    if (!configWeb) {
      throw new NotFoundException('ConfigWeb no encontrado');
    }

    // Obtener el último orden
    const lastBanner = await this.prisma.imagenBanner.findFirst({
      where: { configWebId },
      orderBy: { orden: 'desc' },
    });

    const banner = await this.prisma.imagenBanner.create({
      data: {
        ...bannerData,
        configWebId,
        orden: bannerData.orden ?? (lastBanner ? lastBanner.orden + 1 : 0),
      },
    });

    return ConfigWebMapper.bannerToResponseDto(banner);
  }

  async updateBanner(bannerId: number, bannerData: any) {
    try {
      const banner = await this.prisma.imagenBanner.update({
        where: { id: bannerId },
        data: bannerData,
      });

      return ConfigWebMapper.bannerToResponseDto(banner);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Banner no encontrado');
      }
      throw error;
    }
  }

  async removeBanner(bannerId: number) {
    try {
      await this.prisma.imagenBanner.delete({
        where: { id: bannerId },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Banner no encontrado');
      }
      throw error;
    }
  }

  async getBanners(configWebId: number) {
    const configWeb = await this.prisma.configWeb.findUnique({
      where: { id: configWebId },
    });

    if (!configWeb) {
      throw new NotFoundException('ConfigWeb no encontrado');
    }

    const banners = await this.prisma.imagenBanner.findMany({
      where: { configWebId },
      orderBy: { orden: 'asc' },
    });

    return banners.map(banner => ConfigWebMapper.bannerToResponseDto(banner));
  }
}
