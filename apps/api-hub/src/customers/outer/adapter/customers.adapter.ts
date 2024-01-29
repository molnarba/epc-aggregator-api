import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { CustomersPort } from '../../inner/ports/customers.port';
import { from, Observable, of } from 'rxjs';
import { CommercetoolsService } from '../../../crosscutting/shared/commercetools.service';
import { catchError, map, mergeMap, switchMap, take, tap } from 'rxjs/operators';
import { StringUtil } from '../../../crosscutting/util/string.util';
import { CartsPort } from '../../../carts/inner/ports/carts.port';
import {
  Customer as GqlCustomer,
  CustomerUpdateAction as GqlCustomerUpdateAction,
  SignUpCustomerData,
} from 'apps/api-hub/src/customers/types.generated';
import { CommercetoolsTokenResponse } from './commercetools-token.response';
import { AuthorizationToken } from '../../../crosscutting/shared/authorization/authorization.token';
import { CustomerService } from '../service/customer.service';
import { CartsConstants } from '../../../carts/carts.constants';
import { CustomersConstants } from '../../customers.constants';
import { Converter } from '../../../crosscutting/shared/converter/converter.interface';
import {
  CartResourceIdentifier,
  ClientResponse,
  Customer as CtCustomer,
  CustomerSignInResult,
  MyCustomerUpdateAction as CtCustomerUpdateAction,
} from '@commercetools/platform-sdk';
import { SharedConstants } from '../../../crosscutting/shared/shared.constants';
import { CartUpdateAction as GqlCartUpdateAction } from 'apps/api-hub/src/carts/types.generated';

@Injectable()
export class CustomersAdapter implements CustomersPort {
  constructor(
    private readonly commercetoolsService: CommercetoolsService,
    @Inject(CustomersConstants.CUSTOMERS_CONVERTER)
    private readonly customerConverter: Converter<CtCustomer, GqlCustomer>,
    @Inject(CustomersConstants.CUSTOMER_UPDATE_ACTION_CONVERTER)
    private readonly customerUpdateActionConverter: Converter<
      Array<GqlCustomerUpdateAction>,
      Array<CtCustomerUpdateAction>
    >,
    @Inject(SharedConstants.COMMERCETOOLS_TOKEN_CONVERTER)
    private readonly accessTokenConverter: Converter<CommercetoolsTokenResponse, AuthorizationToken>,
    private readonly customerService: CustomerService,
    @Inject(CartsConstants.CARTS_PORT) private readonly cartsPort: CartsPort,
    @Inject(SharedConstants.LOGGER_PROVIDER) private readonly loggerService: LoggerService
  ) {}

  signUpCustomer(
    customerData: SignUpCustomerData,
    anonymousCartId: string
  ): Observable<{ customer: GqlCustomer; authorizationToken: AuthorizationToken }> {
    const { email, password, firstName, lastName, salutation } = { ...customerData };
    const cartResourceIdentifier = this.buildCartResourceIdentifier(anonymousCartId);

    return from(
      this.commercetoolsService
        .request()
        .customers()
        .post({
          body: {
            email: email,
            password: password,
            firstName: firstName,
            lastName: lastName,
            salutation: salutation,
            anonymousCart: cartResourceIdentifier,
          },
        })
        .execute()
    ).pipe(
      catchError((error: any) => {
        this.loggerService.error(
          `Error signing-up customer with email '${email}': ${error.message}`,
          CustomersAdapter.name
        );
        throw error;
      }),
      map((response: ClientResponse<CustomerSignInResult>) => {
        this.loggerService.debug(`Successfully signed-up customer with email '${email}'`, CustomersAdapter.name);
        return this.customerConverter.convert(response.body.customer);
      }),
      switchMap(() => {
        // NB: the previously anonymous cart is already assigned to the new customer,
        // so we don't pass the anonymous-cart-ID to the sign-in process
        return this.signInCustomer(email, password, StringUtil.EMPTY);
      })
    );
  }

  signInCustomer(
    email: string,
    password: string,
    anonymousCartId: string
  ): Observable<{ customer: GqlCustomer; authorizationToken: AuthorizationToken }> {
    const cartResourceIdentifier = this.buildCartResourceIdentifier(anonymousCartId);
    return from(
      this.commercetoolsService
        .request()
        .login()
        .post({
          body: {
            email: email,
            password: password,
            anonymousCart: cartResourceIdentifier,
          },
        })
        .execute()
    ).pipe(
      catchError((error: any) => {
        this.loggerService.error(
          `Error signing-in customer with ID '${email}': ${error.message}`,
          CustomersAdapter.name
        );
        throw error;
      }),
      tap((response: ClientResponse<CustomerSignInResult>) => {
        if (
          StringUtil.isNotEmpty(anonymousCartId) &&
          response?.body?.cart &&
          anonymousCartId !== response.body.cart.id
        ) {
          this.loggerService.error(
            `Deleting anonymous (merged) cart with ID '${anonymousCartId}'`,
            CustomersAdapter.name
          );
          this.cartsPort.deleteCart(anonymousCartId).pipe(take(1)).subscribe();
        }
      }),
      switchMap((response: ClientResponse<CustomerSignInResult>) => {
        if (response?.body?.cart) {
          // LineItems having the 'externalPrice' attribute set are not merged
          // (same as for adding LineItems having the 'externalPrice' attribute set)
          // see also https://docs.commercetools.com/api/projects/carts#add-lineitem
          const cart = response.body.cart;
          this.loggerService.debug(
            `Merging duplicate line-items in cart with ID '${cart.id}' of customer with ID '${response.body.customer.id}'`,
            CustomersAdapter.name
          );
          const cartUpdateActions: Array<GqlCartUpdateAction> = this.customerService.mergeDuplicateLineItems(cart);
          // it is safe to pass the locale 'undefined', because we are not interested in localized cart contents here
          if (cartUpdateActions && cartUpdateActions.length != 0) {
            return this.cartsPort
              .batchUpdateMyCart(cart.id, cartUpdateActions, cart.locale, cart.totalPrice?.currencyCode)
              .pipe(
                map(() => {
                  return response.body.customer;
                })
              );
          }
        }

        return of(response.body.customer);
      }),
      mergeMap((ctCustomer: CtCustomer) => {
        return this.obtainAccessToken(email, password).pipe(
          map((authorizationToken: AuthorizationToken) => {
            // pass the customer and authorization token down the pipe chain with a nested pipe and map
            return { commercetoolsCustomer: ctCustomer, authorizationToken: authorizationToken };
          })
        );
      }),
      map(({ commercetoolsCustomer, authorizationToken }) => {
        this.loggerService.debug(`Successfully signed-in customer with ID '${email}'`, CustomersAdapter.name);
        return {
          customer: this.customerConverter.convert(commercetoolsCustomer),
          authorizationToken: authorizationToken,
        };
      })
    );
  }

  private buildCartResourceIdentifier(anonymousCartId: string): CartResourceIdentifier {
    return StringUtil.isNotEmpty(anonymousCartId)
      ? {
          typeId: 'cart',
          id: anonymousCartId,
        }
      : undefined;
  }

  public obtainAccessToken(username: string, password: string): Observable<AuthorizationToken> {
    return from(this.commercetoolsService.obtainAccessToken(username, password)).pipe(
      map((response: CommercetoolsTokenResponse) => {
        this.loggerService.debug(
          `Successfully obtained new access-token for customer with ID '${username}'`,
          CustomersAdapter.name
        );
        return this.accessTokenConverter.convert(<CommercetoolsTokenResponse>response);
      })
    );
  }

  refreshAccessToken(refreshToken: string): Observable<AuthorizationToken> {
    return from(this.commercetoolsService.refreshAccessToken(refreshToken)).pipe(
      map((response: CommercetoolsTokenResponse) => {
        this.loggerService.debug(`Successfully refreshed access-token '${refreshToken}'`, CustomersAdapter.name);

        // Commercetools doesn't create a new refresh-token for refreshed access-tokens
        // thus, we set the existing refresh-token in the refreshed access-token
        let authorizationToken: AuthorizationToken = this.accessTokenConverter.convert(
          <CommercetoolsTokenResponse>response
        );
        authorizationToken.refreshToken = refreshToken;

        return authorizationToken;
      })
    );
  }

  fetchMyCustomer(): Observable<GqlCustomer> {
    return from(this.commercetoolsService.request().me().get().execute()).pipe(
      map((response: ClientResponse<CtCustomer>) => {
        this.loggerService.debug('Successfully fetched my customer', CustomersAdapter.name);
        return this.customerConverter.convert(response.body);
      })
    );
  }

  batchUpdateMyCustomer(gqlCustomerUpdateActions: Array<GqlCustomerUpdateAction>): Observable<GqlCustomer> {
    if (!gqlCustomerUpdateActions || gqlCustomerUpdateActions.length === 0) {
      throw new Error('Unable to update customer: no update-actions given!');
    }

    let ctCustomerUpdateActions: Array<CtCustomerUpdateAction> =
      this.customerUpdateActionConverter.convert(gqlCustomerUpdateActions);

    return from(this.commercetoolsService.request().me().get().execute()).pipe(
      catchError((error: any) => {
        this.loggerService.error(error.message, CustomersAdapter.name);
        throw error;
      }),
      switchMap((response: ClientResponse<CtCustomer>) => {
        const ctCustomer = response.body;
        return this.executeBatchUpdateCustomer(ctCustomer.id, ctCustomer.version, ctCustomerUpdateActions);
      })
    );
  }

  private executeBatchUpdateCustomer(
    customerId: String,
    customerVersion: number,
    ctCustomerUpdateActions: Array<CtCustomerUpdateAction>
  ): Observable<GqlCustomer> {
    return from(
      this.commercetoolsService
        .request()
        .me()
        .post({
          body: {
            version: customerVersion,
            actions: ctCustomerUpdateActions,
          },
        })
        .execute()
    ).pipe(
      catchError((error: any) => {
        this.loggerService.error(error.message, CustomersAdapter.name);
        throw error;
      }),
      map((response: ClientResponse<CtCustomer>) => {
        this.loggerService.debug(`Successfully updated customer with ID '${customerId}'`, CustomersAdapter.name);
        return this.customerConverter.convert(response.body);
      })
    );
  }
}
