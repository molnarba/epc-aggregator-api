import { Module } from '@nestjs/common';
import { interfaceProviders } from './interface-provider-config';
import { CartsResolver } from './inner/resolver/carts.resolver';
import { PricesModule } from '../prices/prices.module';
import { CartUpdateActionConversionService } from './outer/service/cart-update-action-conversion.service';

@Module({
  // providers instantiated by this module
  providers: [...interfaceProviders, CartsResolver, CartUpdateActionConversionService],
  // providers of this module that should be available in other modules
  exports: [...interfaceProviders],
  // modules that export providers which are required by this module
  imports: [PricesModule],
})
export class CartsModule {}
