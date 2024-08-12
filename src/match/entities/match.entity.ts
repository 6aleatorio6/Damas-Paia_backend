import { UUID } from 'crypto';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Match {
  @PrimaryGeneratedColumn('uuid')
  uuid: UUID;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  player1: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  player2: User;

  @Column({ nullable: true, default: null, enum: ['player1', 'player2'] })
  winner: Players;

  @Column({ nullable: true, default: 'player1' })
  turn: Players;

  @CreateDateColumn()
  dateInit: Date;

  @Column({ nullable: true })
  dateEnd?: Date;
}

export type Players = 'player1' | 'player2';
