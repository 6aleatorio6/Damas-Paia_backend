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

  @Put()
  update(@Request() req, @Body() updateUser: UpdateUserDto) {
    return this.userService.update(+req.user.id, updateUser);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }
  @Get()
  findAll() {
    return this.userService.findAll();
  }
}
