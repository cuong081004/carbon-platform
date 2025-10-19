import { Test, TestingModule } from '@nestjs/testing';
import { CarbonWalletController } from './carbon-wallet.controller';

describe('CarbonWalletController', () => {
  let controller: CarbonWalletController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CarbonWalletController],
    }).compile();

    controller = module.get<CarbonWalletController>(CarbonWalletController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
