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

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  winner: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  turn: User;

  @CreateDateColumn()
  dateInit: Date;

  @Column({ nullable: true })
  dateEnd?: Date;
}
