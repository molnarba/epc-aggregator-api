import { Test, TestingModule } from '@nestjs/testing';
import { PriceServiceAdapter } from './price-service.adapter';
import { ApolloService } from 'apps/api-hub/src/crosscutting/shared/apollo.service';
import { ConfigurationService } from 'apps/api-hub/src/crosscutting/shared/configuration/configuration.service';
import { ConsoleLogger } from '@nestjs/common';
import { SharedConstants } from '../../../crosscutting/shared/shared.constants';

xdescribe('PriceServiceAdapter', () => {
  let priceServiceAdapter: PriceServiceAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriceServiceAdapter,
        ApolloService,
        {
          provide: ConfigurationService,
          useValue: {
            priceServiceApiUrl: 'http://localhost:8080/graphql',
          },
        },
        { provide: SharedConstants.LOGGER_PROVIDER, useValue: new ConsoleLogger() },
      ],
    }).compile();

    priceServiceAdapter = module.get<PriceServiceAdapter>(PriceServiceAdapter);
  });

  it('finds data for SKU', async () => {
    priceServiceAdapter.findBySku('wera_torks_m2').subscribe((result) => {
      console.log(result);
    });
  });
});
