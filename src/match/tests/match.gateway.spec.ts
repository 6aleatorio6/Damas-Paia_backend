import { Test, TestingModule } from '@nestjs/testing';
import { MatchGateway } from '../match.gateway';
import { MatchService } from '../match.service';

describe('MatchGateway', () => {
  let gateway: MatchGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MatchGateway, MatchService],
    }).compile();

    gateway = module.get<MatchGateway>(MatchGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
