import { User } from 'src/user/entities/user.entity';
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class OAuth2 {
  @PrimaryGeneratedColumn()
  id: string;

  @OneToOne(() => User, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column()
  providerName: string;

  @Column()
  providerId: string;
}
