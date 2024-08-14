import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Match } from './match.entity';
import { User } from 'src/user/entities/user.entity';

@Entity()
export class Piece {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Match)
  match: Match;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  player: User;

  @Column()
  x: number;
  @Column()
  y: number;

  @Column({ default: false })
  queen?: boolean;
}
