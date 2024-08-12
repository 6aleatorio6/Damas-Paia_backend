import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Match } from './match.entity';

@Entity()
export class Piece {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Match)
  match: Match;

  @Column({ enum: ['player1', 'player2'] })
  player: 'player1' | 'player2';

  @Column()
  x: number;
  @Column()
  y: number;

  @Column({ default: false })
  queen?: boolean;
}
