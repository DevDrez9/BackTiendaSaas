import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, Body, BadRequestException, Req } from '@nestjs/common';
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
export class UploadController {
  @Post('image')
  @Roles(Rol.ADMIN, Rol.MANAGER, Rol.USER)
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 }, // máx 5 MB
    fileFilter: (_req, file, cb) => {
      if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(file.mimetype)) {
        return cb(new BadRequestException('Solo se permiten imágenes JPG, PNG, WEBP, GIF o AVIF'), false);
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
    
    // En Docker es un volumen persistente (UPLOADS_DIR=/app/uploads)
    const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, filename);

    try {
      await sharp(file.buffer, { limitInputPixels: 40_000_000 })
        .rotate() // respeta la orientación de fotos de celular
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(filePath);
    } catch {
      throw new BadRequestException('La imagen está dañada o no es válida');
    }

    const baseUrl = process.env.APP_URL || process.env.API_URL || `${req.protocol}://${req.get('host')}`;

    return {
      url: `${baseUrl}/uploads/${filename}`
    };
  }
}
