import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsBoolean, IsHexColor, ValidateNested } from 'class-validator';
import { CreateTiendaDto } from './create-tienda.dto';


export class UpdateTiendaDto extends PartialType(CreateTiendaDto) {}
