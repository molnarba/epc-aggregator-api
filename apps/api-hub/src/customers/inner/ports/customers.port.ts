import { Observable } from 'rxjs';
import { Customer, CustomerUpdateAction, SignUpCustomerData } from '../../types.generated';
import { AuthorizationToken } from '../../../crosscutting/shared/authorization/authorization.token';

export interface CustomersPort {
  signUpCustomer(
    customerData: SignUpCustomerData,
    anonymousCartId: string
  ): Observable<{ customer: Customer; authorizationToken: AuthorizationToken }>;
  signInCustomer(
    email: string,
    password: string,
    anonymousCartId: string
  ): Observable<{ customer: Customer; authorizationToken: AuthorizationToken }>;
  obtainAccessToken(username: string, password: string): Observable<AuthorizationToken>;
  refreshAccessToken(refreshToken: string): Observable<AuthorizationToken>;
  fetchMyCustomer(): Observable<Customer>;
  batchUpdateMyCustomer(actions: Array<CustomerUpdateAction>): Observable<Customer>;
}
