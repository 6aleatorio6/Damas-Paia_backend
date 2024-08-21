import { IsNumber, ValidateNested } from 'class-validator';

export class MoveDto {
  @IsNumber()
  id: number;

  @ValidateNested()
  to: {
    x: number;
    y: number;
  };
}
