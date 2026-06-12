import { IsNumber, Min } from 'class-validator';

export class UpdateItemDto {
  @IsNumber()
  @Min(0)
  cantidad: number;
}
