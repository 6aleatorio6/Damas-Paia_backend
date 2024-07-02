import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOne(uuid: string) {
    const user = await this.usersRepository.findOneBy({ uuid });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    return user;
  }

  async create(createUserDto: CreateUserDto) {
    await this.checkIfNomeExists(createUserDto.nome);

    const user = this.usersRepository.create(createUserDto);

    await this.usersRepository.save(user);

    return { ...user, senha: undefined };
  }

  async update(uuid: string, updateUserDto: UpdateUserDto) {
    await this.checkIfNomeExists(updateUserDto.nome);
    const result = await this.usersRepository.update({ uuid }, updateUserDto);

    if (!result.affected) throw new NotFoundException('Usuário não encontrado');
  }

  async remove(uuid: string) {
    const result = await this.usersRepository.delete({ uuid });

    if (!result.affected) throw new NotFoundException('Usuário não encontrado');
  }

  private async checkIfNomeExists(nome?: string) {
    const existsNome = await this.usersRepository.existsBy({ nome });

    if (existsNome) throw new BadRequestException('Esse nome já existe');
  }
}
