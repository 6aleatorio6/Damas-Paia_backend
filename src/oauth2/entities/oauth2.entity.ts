import { User } from 'src/user/entities/user.entity';
import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class OAuth2 {
  @PrimaryGeneratedColumn()
  id: string;

  @OneToOne(() => User, { cascade: true })
  user: User;

  @Column()
  providerName: string;

  @Column()
  providerId: string;
}
