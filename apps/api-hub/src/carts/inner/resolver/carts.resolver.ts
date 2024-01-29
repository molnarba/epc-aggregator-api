import { Inject, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { Cart, CartUpdateAction } from 'apps/api-hub/src/carts/types.generated';
import { RegionDefaultsPipe } from 'apps/api-hub/src/crosscutting/shared/pipes/region-defaults.pipe';
import { CartsPort } from '../ports/carts.port';
import { CurrencyDefaultsPipe } from '../../../crosscutting/shared/pipes/currency-defaults.pipe';
import { CommercetoolsAuthorizationGuard } from '../../../crosscutting/shared/guard/commercetools-authorization.guard';
import { RequestContext } from '../../../crosscutting/shared/request-context';
import { CartsConstants } from '../../carts.constants';
import { GraphqlHttpExceptionFilter } from '../../../crosscutting/shared/filter/graphql-http-exception.filter';
import { UserAuthorizationInterceptor } from '../../../crosscutting/shared/guard/user-authorization-interceptor.service';

@UseFilters(GraphqlHttpExceptionFilter)
@Resolver(() => Cart)
export class CartsResolver {
  constructor(@Inject(CartsConstants.CARTS_PORT) private readonly cartsPort: CartsPort) {}

  @Query('myCart')
  @UseInterceptors(UserAuthorizationInterceptor)
  @UseGuards(CommercetoolsAuthorizationGuard)
  getCartForCustomer(
    @Args('locale', RegionDefaultsPipe) locale: string,
    @Args('currencyCode', CurrencyDefaultsPipe) currencyCode: string
  ): Observable<Cart> {
    return this.cartsPort.fetchOrCreateUserCart(locale, currencyCode);
  }

  @Mutation('batchUpdateMyCart')
  @UseInterceptors(UserAuthorizationInterceptor)
  @UseGuards(CommercetoolsAuthorizationGuard)
  batchUpdateMyCart(
    @Args('actions') cartUpdateActions: [CartUpdateAction],
    @Args('locale', RegionDefaultsPipe) locale: string,
    @Args('currencyCode', CurrencyDefaultsPipe) currencyCode: string
  ): Observable<Cart> {
    return this.cartsPort.batchUpdateMyCart(RequestContext.getCustomerId(), cartUpdateActions, locale, currencyCode);
  }
}
