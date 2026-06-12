import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UserResponseDto } from './dto/response-usuario';
import { Rol } from 'src/common/rol.enum';
import { AssignStoreDto } from './dto/asignar-tienda.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsuarioController {
  constructor(private readonly usersService: UsuarioService) {}

  @Post()
  @Roles(Rol.ADMIN)
  create(@Body() createUserDto: CreateUsuarioDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(Rol.ADMIN, Rol.MANAGER)
  findAll(): Promise<UserResponseDto[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles(Rol.ADMIN, Rol.MANAGER)
  findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Rol.ADMIN)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUsuarioDto): Promise<UserResponseDto> {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @Roles(Rol.ADMIN)
  remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(+id);
  }

  @Post(':id/stores')
  @Roles(Rol.ADMIN)
  assignStore(@Param('id') id: string, @Body() assignStoreDto: AssignStoreDto): Promise<void> {
    return this.usersService.assignStore(+id, assignStoreDto);
  }

  @Delete(':userId/stores/:storeId')
  @Roles(Rol.ADMIN)
  removeStore(@Param('userId') userId: string, @Param('storeId') storeId: string): Promise<void> {
    return this.usersService.removeStore(+userId, +storeId);
  }

  @Get(':id/stores')
  @Roles(Rol.ADMIN, Rol.MANAGER)
  getUserStores(@Param('id') id: string) {
    return this.usersService.getUserStores(+id);
  }
}
