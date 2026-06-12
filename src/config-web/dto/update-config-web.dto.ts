import { PartialType } from '@nestjs/mapped-types';
import { CreateConfigWebDto } from './create-config-web.dto';


export class UpdateConfigWebDto extends PartialType(CreateConfigWebDto) {}
