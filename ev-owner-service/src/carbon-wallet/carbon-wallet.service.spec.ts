import { Test, TestingModule } from '@nestjs/testing';
import { CarbonWalletService } from './carbon-wallet.service';

describe('CarbonWalletService', () => {
  let service: CarbonWalletService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CarbonWalletService],
    }).compile();

    service = module.get<CarbonWalletService>(CarbonWalletService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
