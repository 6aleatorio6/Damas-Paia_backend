import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ unique: true })
  nome: string;

  @Column()
  senha: string;
}
