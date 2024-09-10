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
import { UUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private configService: ConfigService,
  ) {}

  async findOne(uuid: UUID) {
    const user = await this.usersRepository.findOne({
      select: { username: true, email: true, uuid: true },
      where: { uuid },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    return user;
  }

  async create(createUserDto: CreateUserDto) {
    await this.checkIfNameOrEmailExists(createUserDto);

    await this.hashPasswordInDto(createUserDto);

    const user = this.usersRepository.create(createUserDto);

    return await this.usersRepository.save(user);
  }

  async update(uuid: UUID, updateUserDto: UpdateUserDto) {
    if (!Object.keys(updateUserDto).length) {
      throw new BadRequestException('Nenhum dado foi enviado para atualização');
    }

    await this.checkIfNameOrEmailExists(updateUserDto);

    await this.hashPasswordInDto(updateUserDto);

    const result = await this.usersRepository.update({ uuid }, updateUserDto);

    if (!result.affected) throw new NotFoundException('Usuário não encontrado');
  }

  async remove(uuid: UUID) {
    const result = await this.usersRepository.delete({ uuid });

    if (!result.affected) throw new NotFoundException('Usuário não encontrado');
  }

  // HELPERS

  private async hashPasswordInDto(dto: Pick<UpdateUserDto, 'password'>) {
    if (dto.password) {
      const hashSalt = +this.configService.get('HASH_SALT', 8);

      dto.password = await bcrypt.hash(dto.password, hashSalt);
    }

    return dto;
  }

  /**
   *  Se eu precisar fazer isso em mais algum lugar aproveito e faço um filtro de execeção global para os erros do typeOrm
   */
  async checkIfNameOrEmailExists({ username, email }: any) {
    if (!username && !email) return;
    const userExist = await this.usersRepository.findOne({
      where: [{ username }, { email }],
      select: { username: true, email: true },
    });

    const usedEmail = userExist?.email === email ? 'email' : '';
    const usedName = userExist?.username === username ? 'nome' : '';
    const ambos = usedEmail && usedName ? ' e ' : '';

    if (userExist)
      throw new BadRequestException(
        `Esse ${usedEmail}${ambos}${usedName} já ${ambos ? 'foram' : 'foi'} usado`,
      );
  }
}
