// src/users/dto/assign-store.dto.ts
import { IsNumber } from 'class-validator';

export class AssignStoreDto {
  @IsNumber()
  tiendaId: number;
}
