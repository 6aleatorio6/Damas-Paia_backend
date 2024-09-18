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

  @Column({ nullable: true, enum: ['player1', 'player2'] })
  winner: 'player1' | 'player2';

  @Column({ enum: ['player1', 'player2'], default: 'player1' })
  turn: 'player1' | 'player2';

  @CreateDateColumn()
  dateInit: Date;

  @Column({ nullable: true })
  dateEnd?: Date;
}
