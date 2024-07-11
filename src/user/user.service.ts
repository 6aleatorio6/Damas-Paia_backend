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
    const user = await this.usersRepository.findOne({
      select: { username: true, email: true, uuid: true },
      where: { uuid },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    return user;
  }

  async create(createUserDto: CreateUserDto) {
    await this.checkIfNameOrEmailExists(createUserDto.username);

    const user = this.usersRepository.create({
      ...createUserDto,
      password: createUserDto.password,
    });

    await this.usersRepository.save(user);
  }

  async update(uuid: string, updateUserDto: UpdateUserDto) {
    await this.checkIfNameOrEmailExists(updateUserDto);

    const result = await this.usersRepository.update({ uuid }, updateUserDto);

    if (!result.affected) throw new NotFoundException('Usuário não encontrado');
  }

  async remove(uuid: string) {
    const result = await this.usersRepository.delete({ uuid });

    if (!result.affected) throw new NotFoundException('Usuário não encontrado');
  }

  private async checkIfNameOrEmailExists({ username, email }: any) {
    const exist = await this.usersRepository.existsBy({ username, email });

    if (username && exist)
      throw new BadRequestException('Esse nome já foi usado');

    if (email && exist)
      throw new BadRequestException('Esse email já foi usado');
  }
}
