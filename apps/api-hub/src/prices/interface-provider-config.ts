import { PriceServiceAdapter } from './outer/adapter/price-service.adapter';
import { PricesConstants } from './prices.constants';

export const interfaceProviders = [{ provide: PricesConstants.PRICES_PROVIDER, useClass: PriceServiceAdapter }];
