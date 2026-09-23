import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, Body, BadRequestException, InternalServerErrorException, Logger, OnModuleInit, Req } from '@nestjs/common';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../common/rol.enum';
import * as sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';
import { randomUUID } from 'crypto';

@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadController implements OnModuleInit {
  private readonly logger = new Logger(UploadController.name);
  private readonly uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');

  // Al arrancar: avisar en los logs si la carpeta de imágenes no es escribible
  // (típico en Docker cuando el volumen quedó con dueño root y la app corre como "node")
  onModuleInit() {
    try {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
      fs.accessSync(this.uploadsDir, fs.constants.W_OK);
    } catch (e) {
      this.logger.error(
        `La carpeta de imágenes ${this.uploadsDir} no es escribible (${(e as Error).message}). ` +
        `Arreglo: docker compose exec -u root backend chown -R node:node ${this.uploadsDir}`,
      );
    }
  }

  @Post('image')
  @Roles(Rol.ADMIN, Rol.MANAGER, Rol.USER)
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 }, // máx 5 MB
    fileFilter: (_req, file, cb) => {
      // image/jpg y image/pjpeg los envían algunos navegadores/Windows para archivos JPG normales
      if (!/^image\/(jpeg|jpg|pjpeg|png|webp|gif|avif)$/.test(file.mimetype)) {
        return cb(new BadRequestException(`Formato no permitido (${file.mimetype || 'desconocido'}). Solo JPG, PNG, WEBP, GIF o AVIF`), false);
      }
      cb(null, true);
    },
  }))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
    @Body('tiendaId') tiendaId?: string,
    @Body('productoNombre') productoNombre?: string
  ) {
    if (!file) {
      throw new BadRequestException('Archivo no proveído');
    }

    const filename = `${randomUUID()}.webp`;
    const filePath = path.join(this.uploadsDir, filename);

    // 1) Procesar la imagen: si falla aquí, el archivo realmente no es una imagen válida (400)
    let webp: Buffer;
    try {
      webp = await sharp(file.buffer, { limitInputPixels: 40_000_000 })
        .rotate() // respeta la orientación de fotos de celular
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
    } catch (e) {
      this.logger.warn(`Imagen inválida (${file.originalname}, ${file.mimetype}): ${(e as Error).message}`);
      throw new BadRequestException('La imagen está dañada o no es válida');
    }

    // 2) Guardar en disco: si falla es un problema del servidor (permisos/espacio), no del usuario
    try {
      await fs.promises.mkdir(this.uploadsDir, { recursive: true });
      await fs.promises.writeFile(filePath, webp);
    } catch (e) {
      this.logger.error(`No se pudo guardar ${filePath}: ${(e as Error).message}`);
      throw new InternalServerErrorException('No se pudo guardar la imagen en el servidor');
    }

    const baseUrl = process.env.APP_URL || process.env.API_URL || `${req.protocol}://${req.get('host')}`;

    return {
      url: `${baseUrl}/uploads/${filename}`
    };
  }
}
