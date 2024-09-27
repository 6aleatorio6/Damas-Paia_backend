import { Injectable } from '@nestjs/common';
import { CreateOauth2Dto } from './dto/create-oauth2.dto';
import { UpdateOauth2Dto } from './dto/update-oauth2.dto';

@Injectable()
export class Oauth2Service {
  create(createOauth2Dto: CreateOauth2Dto) {
    return 'This action adds a new oauth2';
  }

  findAll() {
    return `This action returns all oauth2`;
  }

  findOne(id: number) {
    return `This action returns a #${id} oauth2`;
  }

  update(id: number, updateOauth2Dto: UpdateOauth2Dto) {
    return `This action updates a #${id} oauth2`;
  }

  remove(id: number) {
    return `This action removes a #${id} oauth2`;
  }
}
