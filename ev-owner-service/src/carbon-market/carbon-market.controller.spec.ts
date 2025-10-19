import { Test, TestingModule } from '@nestjs/testing';
import { CarbonMarketController } from './carbon-market.controller';

describe('CarbonMarketController', () => {
  let controller: CarbonMarketController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CarbonMarketController],
    }).compile();

    controller = module.get<CarbonMarketController>(CarbonMarketController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
