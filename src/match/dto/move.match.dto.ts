import { IsNumber, ValidateNested } from 'class-validator';

export class MatchMoveDto {
  @IsNumber()
  id: number;

  @ValidateNested()
  to: {
    x: number;
    y: number;
  };
}
