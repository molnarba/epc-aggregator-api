import { Args, Context, GraphQLExecutionContext, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Inject, LoggerService, UseFilters, UseGuards } from '@nestjs/common';
import { CustomersPort } from '../ports/customers.port';
import { Observable, of } from 'rxjs';
import { Customer, CustomerUpdateAction, SignUpCustomerData } from '../../types.generated';
import { map, tap } from 'rxjs/operators';
import { RequestContext } from '../../../crosscutting/shared/request-context';
import { AuthorizationTokenService } from '../../../crosscutting/shared/authorization/authorization-token.service';
import { CommercetoolsAuthorizationGuard } from '../../../crosscutting/shared/guard/commercetools-authorization.guard';
import { JsonWebTokenAuthorizationGuard } from '../../../crosscutting/shared/guard/json-web-token-authorization.guard';
import { CustomersConstants } from '../../customers.constants';
import { GraphqlHttpExceptionFilter } from '../../../crosscutting/shared/filter/graphql-http-exception.filter';
import { SharedConstants } from '../../../crosscutting/shared/shared.constants';

@UseFilters(GraphqlHttpExceptionFilter)
@Resolver(() => Customer)
export class CustomersResolver {
  constructor(
    private readonly authorizationTokenService: AuthorizationTokenService,
    @Inject(CustomersConstants.CUSTOMERS_PROVIDER) private readonly customersPort: CustomersPort,
    @Inject(SharedConstants.LOGGER_PROVIDER) private readonly loggerService: LoggerService
  ) {}

  @Mutation('signUpCustomer')
  signUpCustomer(
    @Context() gqlExecutionContext: GraphQLExecutionContext,
    @Args('customerData') customerData: SignUpCustomerData,
    @Args('anonymousCartId') anonymousCartId: string,
    @Args('rememberMe') rememberMe: boolean
  ): Observable<Customer> {
    return this.customersPort.signUpCustomer(customerData, anonymousCartId).pipe(
      tap(({ customer, authorizationToken }) => {
        this.authorizationTokenService.storeAuthorizationTokenCookie(
          // @ts-ignore
          gqlExecutionContext.res,
          authorizationToken,
          customer.id
        );
        RequestContext.get().setAuthorizationToken(authorizationToken);
        this.loggerService.debug('Stored authorization cookie in response', CustomersResolver.name);
      }),
      map(({ customer, authorizationToken }) => {
        return customer;
      })
    );
  }

  @Query('signInCustomer')
  signInCustomer(
    @Context() gqlExecutionContext: GraphQLExecutionContext,
    @Args('email') email: string,
    @Args('password') password: string,
    @Args('anonymousCartId') anonymousCartId: string,
    @Args('rememberMe') rememberMe: boolean
  ): Observable<Customer> {
    return this.customersPort.signInCustomer(email, password, anonymousCartId).pipe(
      tap(({ customer, authorizationToken }) => {
        authorizationToken.rememberMe = rememberMe;
        this.authorizationTokenService.storeAuthorizationTokenCookie(
          // @ts-ignore
          gqlExecutionContext.res,
          authorizationToken,
          customer.id
        );
        RequestContext.get().setAuthorizationToken(authorizationToken);
        this.loggerService.debug('Stored authorization cookie in response', CustomersResolver.name);
      }),
      map(({ customer, authorizationToken }) => {
        return customer;
      })
    );
  }

  @Query('signOutCustomer')
  signOutCustomer(@Context() gqlExecutionContext: GraphQLExecutionContext): Observable<Boolean> {
    // @ts-ignore
    this.authorizationTokenService.deleteAuthorizationTokenCookie(gqlExecutionContext.res);
    return of(true);
  }

  // NB: at startup the user might have a JWT (= remember-me enabled during sign-in/sign-up),
  // but he did not yet read his customer object to check if he is authorized or not.
  // thus, he is not able to provide his encrypted customer-ID as a CSRF-token,
  // and we cannot use the 'CustomerAuthorizationGuard' here.
  @UseGuards(JsonWebTokenAuthorizationGuard, CommercetoolsAuthorizationGuard)
  @Query('myCustomer')
  myCustomer(): Observable<Customer> {
    return this.customersPort.fetchMyCustomer();
  }

  @UseGuards(JsonWebTokenAuthorizationGuard, CommercetoolsAuthorizationGuard)
  @Mutation('batchUpdateMyCustomer')
  batchUpdateMyCustomer(@Args('actions') customerUpdateActions: Array<CustomerUpdateAction>): Observable<Customer> {
    return this.customersPort.batchUpdateMyCustomer(customerUpdateActions);
  }
}
