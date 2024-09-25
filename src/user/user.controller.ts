import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Put,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { IToken, Public, ReqUser } from 'src/auth/custom.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Get('verify')
  async verify(@Query('username') username, @Query('email') email) {
    return await this.userService.checkIfNameOrEmailExists({ username, email });
  }

  @Get('')
  async findOneByToken(@ReqUser() ReqUser: IToken) {
    return await this.userService.findOneByToken(ReqUser.uuid);
  }

  @Public()
  @Post()
  async create(@Body() dtoUser: CreateUserDto) {
    await this.userService.create(dtoUser);
  }

  @Put('')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateByToken(@ReqUser() ReqUser, @Body() userDto: UpdateUserDto) {
    await this.userService.update(ReqUser.uuid, userDto);
  }

  @Delete('')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeByToken(@ReqUser() ReqUser) {
    await this.userService.remove(ReqUser.uuid);
  }
}
