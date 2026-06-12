import { IsNumber } from 'class-validator';

export class AssignTiendaDto {
  @IsNumber()
  tiendaId: number;
}
