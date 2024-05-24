import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  Put,
  Request,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public } from '../auth/auth.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Post()
  @HttpCode(201)
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Get('/all')
  findAll() {
    return this.userService.findAll();
  }

  @Put()
  updateToken(@Request() req, @Body() updateUser: UpdateUserDto) {
    return this.userService.update(+req.user.id, updateUser);
  }

  @Get('')
  findToken(@Request() req) {
    return this.userService.findOne(+req.user.id);
  }
}
