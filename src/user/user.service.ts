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

    if (!user) throw new NotFoundException('usuario não encontrado');

    return user;
  }

  async create(createUser: CreateUserDto) {
    await this.existNome(createUser.nome);
    const user = this.usersRepository.create(createUser);

    return await this.usersRepository.save(user);
  }

  async update(uuid: string, updateUserDto: UpdateUserDto) {
    await this.existNome(updateUserDto.nome);
    return this.usersRepository.update({ uuid }, updateUserDto);
  }

  async remove(uuid: string) {
    const result = await this.usersRepository.delete({ uuid });
    if (!result.affected) throw new NotFoundException('usuario não encontrado');

    return { message: 'usuario deletado!' };
  }

  private async existNome(nome?: string) {
    const existsNome = await this.usersRepository.existsBy({ nome });

    if (existsNome) throw new BadRequestException('Esse nome já existe');
  }
}
