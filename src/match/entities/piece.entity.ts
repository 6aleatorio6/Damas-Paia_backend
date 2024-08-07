import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Match, Players } from './match.entity';

@Entity()
export class Piece {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Match)
  match: Match;

  @Column({ enum: ['player1', 'player2'] })
  player: Players;

  @Column()
  x: number;
  @Column()
  y: number;

  @Column()
  queen: boolean;
}
