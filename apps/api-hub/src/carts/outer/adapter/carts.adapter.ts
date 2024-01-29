import { HttpStatus, Inject, Injectable, LoggerService, NotFoundException } from '@nestjs/common';
import {
  Cart,
  Cart as CtCart,
  CartAddLineItemAction as CtCartAddLineItemAction,
  CartChangeLineItemQuantityAction as CtCartChangeLineItemQuantityAction,
  CartUpdateAction as CtCartUpdateAction,
  ClientResponse,
  Order,
} from '@commercetools/platform-sdk';
import { CommercetoolsService } from 'apps/api-hub/src/crosscutting/shared/commercetools.service';
import { defaultIfEmpty, forkJoin, from, Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { CartsPort } from 'apps/api-hub/src/carts/inner/ports/carts.port';
import {
  Cart as GqlCart,
  CartUpdateAction as GqlCartUpdateAction,
  PlaceOrderAction,
} from 'apps/api-hub/src/carts/types.generated';
import { LocaleUtil } from '../../../crosscutting/util/locale.util';
import { ConfigurationService } from '../../../crosscutting/shared/configuration/configuration.service';
import { StringUtil } from '../../../crosscutting/util/string.util';
import { MonitoringService } from '../../../crosscutting/monitoring/monitoring.service';
import { CartUpdateActionConversionService } from '../service/cart-update-action-conversion.service';
import { CartsConstants } from '../../carts.constants';
import { LocalizedConverter } from '../../../crosscutting/shared/converter/localized-converter.interface';
import { SharedConstants } from '../../../crosscutting/shared/shared.constants';

@Injectable()
export class CartsAdapter implements CartsPort {
  private defaultLocale: string;
  private anonymousCartDeleteDaysAfterLastModification: number;
  private customerCartDeleteDaysAfterLastModification: number;
  private defaultCurrencyCode: string;

  constructor(
    private readonly commercetoolsService: CommercetoolsService,
    @Inject(CartsConstants.CARTS_CONVERTER)
    private readonly cartConverter: LocalizedConverter<CtCart, GqlCart>,
    private readonly cartUpdateActionConversionService: CartUpdateActionConversionService,
    private readonly configurationService: ConfigurationService,
    private readonly monitoringService: MonitoringService,
    @Inject(SharedConstants.LOGGER_PROVIDER) private readonly loggerService: LoggerService
  ) {
    this.defaultLocale = this.configurationService.defaultLocale;
    this.anonymousCartDeleteDaysAfterLastModification =
      this.configurationService.anonymousCartDeleteDaysAfterLastModification;
    this.customerCartDeleteDaysAfterLastModification =
      this.configurationService.customerCartDeleteDaysAfterLastModification;
    this.defaultCurrencyCode = this.configurationService.defaultCurrencyCode;
  }

  fetchOrCreateUserCart(locale: string, currencyCode: string): Observable<GqlCart> {
    return this.internalFetchOrCreateCart(locale, currencyCode, true);
  }

  private internalFetchOrCreateCart(
    locale: string,
    currencyCode: string,
    createIfAbsent: boolean
  ): Observable<GqlCart> {
    return from(this.commercetoolsService.request().me().activeCart().get().execute()).pipe(
      map((response: ClientResponse<Cart>) => {
        if (response.body) {
          return response.body;
        } else {
          throw new NotFoundException(`No active cart found'`);
        }
      }),
      catchError((error: any) => {
        this.loggerService.debug(error.message, CartsAdapter.name);
        if (
          (error.statusCode === HttpStatus.BAD_REQUEST || error.statusCode === HttpStatus.NOT_FOUND) &&
          StringUtil.isNotEmpty(currencyCode) &&
          createIfAbsent
        ) {
          this.loggerService.debug(`Cart for authorized user does not exist, creating a new cart`, CartsAdapter.name);
          return this.createDedicatedCart(locale, currencyCode);
        } else {
          throw error;
        }
      }),
      map((cart: CtCart) => {
        return this.cartConverter.convert(cart, locale);
      })
    );
  }

  private internalFetchOrCreateCartByCartId(
    cartId: string,
    locale: string,
    currencyCode: string,
    createIfAbsent: boolean
  ): Observable<GqlCart> {
    if (StringUtil.isEmpty(cartId)) {
      cartId = undefined;
    }

    return from(
      this.commercetoolsService
        .request()
        .carts()
        .withId({
          ID: cartId,
        })
        .get({
          queryArgs: {
            sort: 'lastModifiedAt desc',
            limit: 1,
            offset: 0,
          },
        })
        .execute()
    ).pipe(
      catchError((error: any) => {
        this.loggerService.debug(error.message, CartsAdapter.name);
        if (error.statusCode === 404 && StringUtil.isNotEmpty(currencyCode) && createIfAbsent) {
          this.loggerService.debug(`Cart with ID '${cartId}' does not exist, creating a new cart`, CartsAdapter.name);
          return this.createDedicatedCart(locale, currencyCode);
        } else {
          this.loggerService.error(error.message, CartsAdapter.name);
          throw error;
        }
      }),
      map((response: ClientResponse<CtCart>) => {
        this.loggerService.debug(`Successfully loaded cart with ID '${response.body?.id}'`, CartsAdapter.name);
        return this.cartConverter.convert(response.body, locale);
      })
    );
  }

  private getCountryCodeOrDefault(locale: string, defaultLocale: string): string {
    let countryCode: string = LocaleUtil.hasCountryCode(locale)
      ? LocaleUtil.getCountryCode(locale)
      : LocaleUtil.getCountryCode(defaultLocale);

    if (StringUtil.isEmpty(countryCode)) {
      throw new Error(
        `Neither the given locale '${locale}' nor the default locale '${defaultLocale}' provide a country code!`
      );
    }

    return countryCode;
  }

  private createDedicatedCart(locale: string, currencyCode: string): Observable<CtCart> {
    let countryCode: string = this.getCountryCodeOrDefault(locale, this.defaultLocale);
    let currency: string = StringUtil.isNotEmpty(currencyCode) ? currencyCode : this.defaultCurrencyCode;

    return from(
      this.commercetoolsService
        .request()
        .me()
        .carts()
        .post({
          body: {
            currency: currency,
            deleteDaysAfterLastModification: this.customerCartDeleteDaysAfterLastModification,
            shippingAddress: {
              country: countryCode,
            },
          },
        })
        .execute()
    ).pipe(
      tap(() => {
        this.monitoringService.increment('create', CartsAdapter.name);
      }),
      map((response: ClientResponse<CtCart>) => response.body)
    );
  }

  private executeBatchUpdateCart(
    cartId: string,
    cartVersion: number,
    ctCartUpdateActions: Array<CtCartUpdateAction>,
    locale: string
  ): Observable<GqlCart> {
    return from(
      this.commercetoolsService
        .request()
        .carts()
        .withId({ ID: cartId })
        .post({
          body: {
            version: cartVersion,
            actions: ctCartUpdateActions,
          },
        })
        .execute()
    ).pipe(
      catchError((error: any) => {
        this.loggerService.error(error.message, CartsAdapter.name);
        throw error;
      }),
      map((response: ClientResponse) => {
        this.loggerService.debug(`Successfully updated cart with ID '${cartId}'`, CartsAdapter.name);
        return this.cartConverter.convert(response.body, locale);
      })
    );
  }

  deleteCart(cartId: string): Observable<boolean> {
    return from(
      this.commercetoolsService
        .request()
        .carts()
        .withId({
          ID: cartId,
        })
        .get()
        .execute()
    ).pipe(
      catchError((error: any) => {
        if (error.statusCode === 404) {
          return of(true);
        } else {
          this.loggerService.error(`Error loading cart with ID '${cartId}': ${error.message}`, CartsAdapter.name);
          return of(false);
        }
      }),
      switchMap((response: ClientResponse) => {
        let cartVersion: number = +response.body.version;
        return this.commercetoolsService
          .request()
          .carts()
          .withId({
            ID: cartId,
          })
          .delete({
            queryArgs: {
              version: cartVersion,
            },
          })
          .execute();
      }),
      catchError((error: any) => {
        this.loggerService.error(`Error deleting cart with ID '${cartId}': ${error.message}`, CartsAdapter.name);
        return of(false);
      }),
      map(() => {
        this.loggerService.debug(`Successfully deleted cart with ID '${cartId}'`, CartsAdapter.name);
        return true;
      })
    );
  }

  batchUpdateMyCart(
    customerId: string,
    gqlCartUpdateActions: Array<GqlCartUpdateAction>,
    locale: string,
    currencyCode: string
  ): Observable<GqlCart> {
    if (!gqlCartUpdateActions || gqlCartUpdateActions.length === 0) {
      throw new Error('Unable to update cart: no update-actions given!');
    }

    // load the cart, but don't create a new cart if absent
    return this.internalFetchOrCreateCart(locale, currencyCode, true).pipe(
      switchMap((cart: GqlCart) => {
        return this.handleBatchUpdateCart(cart, gqlCartUpdateActions, locale);
      })
    );
  }

  private handleBatchUpdateCart(
    cart: GqlCart,
    gqlCartUpdateActions: Array<GqlCartUpdateAction>,
    locale: string
  ): Observable<GqlCart> {
    // replace all 'addLineItem' actions by 'changeLineItemQuantity' actions for items that already exist in the cart
    this.cartUpdateActionConversionService.replaceAddLineItemActions(cart.cartItems, gqlCartUpdateActions);

    // filter 'placeOrder' action
    const placeOrderAction: PlaceOrderAction = gqlCartUpdateActions.find(
      (action) => action.placeOrderAction
    ) as PlaceOrderAction;

    // convert all un-priced GQL 'addLineItem' actions into observables for priced CT 'addLineItem' actions
    let pricedCtCartAddLineItemActions$: Array<Observable<CtCartAddLineItemAction>> =
      this.cartUpdateActionConversionService.convertPricedAddLineItemActions(cart.currencyCode, gqlCartUpdateActions);

    // convert all un-priced GQL 'changeLineItemQuantity' actions into observables for priced CT 'changeLineItemQuantity' actions
    let pricedCtCartChangeLineItemQuantityActions$: Array<Observable<CtCartChangeLineItemQuantityAction>> =
      this.cartUpdateActionConversionService.convertPricedChangeLineItemQuantityActions(cart, gqlCartUpdateActions);

    // convert any other GQL cart-update actions into CT cart-update actions
    let ctCartUpdateActions: Array<CtCartUpdateAction> =
      this.cartUpdateActionConversionService.convertCartUpdateActions(gqlCartUpdateActions);

    let pricedCtCartUpdateActions$: Array<Observable<CtCartUpdateAction>> = [
      ...pricedCtCartAddLineItemActions$,
      ...pricedCtCartChangeLineItemQuantityActions$,
    ];

    // wait for priced cart-update actions to load prices
    return forkJoin(pricedCtCartUpdateActions$).pipe(
      defaultIfEmpty([]),
      switchMap((pricedCartUpdateActions: Array<CtCartUpdateAction>) => {
        // add the priced cart-update actions back to the array of all cart-update actions
        ctCartUpdateActions.push(...pricedCartUpdateActions);

        // execute the cart update
        return this.executeBatchUpdateCart(cart.id, cart.version, ctCartUpdateActions, locale);
      }),
      switchMap((value: Cart) => {
        if (placeOrderAction) {
          return this.executePlaceOrderAction(value, placeOrderAction).pipe(
            switchMap(() =>
              //create new empty cart (with same currencyCode as old one)
              this.internalFetchOrCreateCartByCartId(value.id, locale, StringUtil.EMPTY, false)
            )
          );
        }
        return of(value);
      })
    );
  }

  private executePlaceOrderAction(cart: GqlCart, placeOrderAction: PlaceOrderAction): Observable<ClientResponse> {
    this.loggerService.log(`Placing new order for cart with ID '${cart.id}'`, CartsAdapter.name);
    return from(
      this.commercetoolsService
        .request()
        .orders()
        .post({
          body: {
            version: cart.version,
            cart: {
              id: cart.id,
              typeId: 'cart',
            },
            orderState: placeOrderAction.orderState ?? undefined,
          },
        })
        .execute()
    ).pipe(
      catchError((error: any) => {
        this.loggerService.error(error.message, CartsAdapter.name);
        throw error;
      }),
      tap((response: ClientResponse<Order>) =>
        this.loggerService.log(`Successfully created Order with ID '${response.body.id}'`, CartsAdapter.name)
      )
    );
  }
}
