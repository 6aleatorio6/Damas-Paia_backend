import { PartialType } from '@nestjs/mapped-types';
import { CreateOauth2Dto } from './create-oauth2.dto';

export class UpdateOauth2Dto extends PartialType(CreateOauth2Dto) {}
