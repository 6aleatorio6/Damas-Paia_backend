import { UUID } from 'crypto';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export const playersEnum = ['player1', 'player2'] as const;

@Entity()
export class Match {
  @PrimaryGeneratedColumn('uuid')
  uuid: UUID;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  player1: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  player2: User;

  @Column({ enum: playersEnum, nullable: true })
  winner: 'player1' | 'player2';

  @Column({ enum: ['checkmate', 'resign', 'timeout'], nullable: true })
  winnerStatus: 'checkmate' | 'resign' | 'timeout';

  @Column({ enum: playersEnum, default: 'player1' })
  turn: 'player1' | 'player2';

  @CreateDateColumn()
  dateInit: Date;

  @Column({ nullable: true })
  dateEnd?: Date;
}
