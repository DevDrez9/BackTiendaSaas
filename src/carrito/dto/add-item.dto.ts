import { IsNumber, Min } from 'class-validator';

export class AddItemDto {
  @IsNumber()
  productoId: number;

  @IsNumber()
  @Min(1)
  cantidad: number;
}
