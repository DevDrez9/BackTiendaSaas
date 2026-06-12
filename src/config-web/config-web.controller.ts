import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ConfigWebService } from './config-web.service';
import { CreateConfigWebDto } from './dto/create-config-web.dto';
import { UpdateConfigWebDto } from './dto/update-config-web.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Rol } from 'src/common/rol.enum';

@Controller('config-web')
export class ConfigWebController {
   constructor(private readonly configWebService: ConfigWebService) {}

  @Post()
  @Roles(Rol.ADMIN)
  create(@Body() createConfigWebDto: CreateConfigWebDto) {
    return this.configWebService.create(createConfigWebDto);
  }

  @Get()
  @Roles(Rol.ADMIN, Rol.MANAGER)
  findAll() {
    return this.configWebService.findAll();
  }

  @Get(':id')
  @Roles(Rol.ADMIN, Rol.MANAGER)
  findOne(@Param('id') id: string) {
    return this.configWebService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Rol.ADMIN, Rol.USER)
  update(@Param('id') id: string, @Body() updateConfigWebDto: UpdateConfigWebDto) {
    return this.configWebService.update(+id, updateConfigWebDto);
  }

  @Delete(':id')
  @Roles(Rol.ADMIN)
  remove(@Param('id') id: string) {
    return this.configWebService.remove(+id);
  }

  @Get(':id/banners')
  @Roles(Rol.ADMIN, Rol.MANAGER)
  getBanners(@Param('id') id: string) {
    return this.configWebService.getBanners(+id);
  }

  @Post(':id/banners')
  @Roles(Rol.ADMIN, Rol.USER)
  addBanner(@Param('id') id: string, @Body() bannerData: any) {
    return this.configWebService.addBanner(+id, bannerData);
  }

  @Patch('banners/:bannerId')
  @Roles(Rol.ADMIN, Rol.USER)
  updateBanner(@Param('bannerId') bannerId: string, @Body() bannerData: any) {
    return this.configWebService.updateBanner(+bannerId, bannerData);
  }

  @Delete('banners/:bannerId')
  @Roles(Rol.ADMIN, Rol.USER)
  removeBanner(@Param('bannerId') bannerId: string) {
    return this.configWebService.removeBanner(+bannerId);
  }
}
