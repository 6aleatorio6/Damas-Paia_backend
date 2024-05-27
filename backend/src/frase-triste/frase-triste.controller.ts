import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Req,
  Put,
} from '@nestjs/common';
import { FraseTristeService } from './frase-triste.service';
import {
  CreateFraseTristeDto,
  UpdateDtoFraseTristeDto,
} from './dto/frase-triste.dto';

@Controller('fraseTriste')
export class FraseTristeController {
  constructor(private readonly fraseTristeService: FraseTristeService) {}

  @Post()
  create(@Req() req, @Body() data: CreateFraseTristeDto) {
    return this.fraseTristeService.create(+req.user?.id, data);
  }

  @Get('/all')
  findMyAll(@Req() req) {
    return this.fraseTristeService.findMyAll(+req.user?.id);
  }

  @Get()
  findAll() {
    return this.fraseTristeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fraseTristeService.findOne(+id);
  }

  @Put(':id')
  update(@Req() req, @Body() data: UpdateDtoFraseTristeDto) {
    return this.fraseTristeService.update(+req.user?.id, +req.param?.id, data);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.fraseTristeService.remove(+req.user?.id, +id);
  }
}
