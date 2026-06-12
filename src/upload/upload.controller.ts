import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, Body, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '../common/rol.enum';
import * as sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';

@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadController {
  @Post('image')
  @Roles(Rol.ADMIN, Rol.MANAGER, Rol.USER)
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage()
  }))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('tiendaId') tiendaId?: string,
    @Body('productoNombre') productoNombre?: string
  ) {
    if (!file) {
      throw new BadRequestException('Archivo no proveído');
    }

    const tId = tiendaId || 'tienda';
    const prodName = productoNombre ? productoNombre.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'producto';
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const randomStr = Math.round(Math.random() * 1e9);
    
    const filename = `${tId}-${prodName}-${dateStr}-${randomStr}.webp`;
    
    // Asegurar que exista la carpeta uploads en la raíz del proyecto
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, filename);

    await sharp(file.buffer)
      .webp({ quality: 80 })
      .toFile(filePath);

    return {
      url: `http://localhost:3000/uploads/${filename}`
    };
  }
}
