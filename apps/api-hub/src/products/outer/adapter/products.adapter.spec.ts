import { Test, TestingModule } from '@nestjs/testing';
import { ProductsAdapter } from './products.adapter';
import { CommercetoolsService } from 'apps/api-hub/src/crosscutting/shared/commercetools.service';
import { ConsoleLogger } from '@nestjs/common';
import { ConfigurationService } from '../../../crosscutting/shared/configuration/configuration.service';
import { ConfigService } from '@nestjs/config';
import { ProductsConverter } from '../converter/products.converter';
import { ProductVariantsConverter } from '../converter/productvariants.converter';
import { SharedConstants } from '../../../crosscutting/shared/shared.constants';
import { ProductListsConverter } from '../converter/product-lists.converter';
import { ProductsConstants } from '../../products.constants';

describe('ProductsAdapter', () => {
  let service: ProductsAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsAdapter,
        ConfigService,
        ConfigurationService,
        { provide: ProductsConstants.PRODUCTS_CONVERTER, useValue: ProductsConverter },
        ProductListsConverter,
        ProductVariantsConverter,
        { provide: CommercetoolsService, useValue: jest.fn() },
        { provide: SharedConstants.LOGGER_PROVIDER, useValue: new ConsoleLogger() },
      ],
    }).compile();

    service = module.get<ProductsAdapter>(ProductsAdapter);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
