import { Test, TestingModule } from '@nestjs/testing';
import { PortDefinitionsService } from './port-definitions.service';

describe('PortDefinitionsService', () => {
  let service: PortDefinitionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PortDefinitionsService],
    }).compile();

    service = module.get<PortDefinitionsService>(PortDefinitionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
