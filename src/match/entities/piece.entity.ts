import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Match, playersEnum } from './match.entity';

@Entity()
export class Piece {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Match)
  match: Match;

  @Column({ enum: playersEnum })
  player: 'player1' | 'player2';

  @Column()
  x: number;
  @Column()
  y: number;

  @Column({ default: false })
  isQueen?: boolean;
}
