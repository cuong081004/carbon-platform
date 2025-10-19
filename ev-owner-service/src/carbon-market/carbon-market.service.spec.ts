import { Test, TestingModule } from '@nestjs/testing';
import { CarbonMarketService } from './carbon-market.service';

describe('CarbonMarketService', () => {
  let service: CarbonMarketService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CarbonMarketService],
    }).compile();

    service = module.get<CarbonMarketService>(CarbonMarketService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
