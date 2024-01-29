import { Namespace } from 'cls-hooked';
import { LocalStorageUtil } from '../util/local-storage.util';
import { StringUtil } from '../util/string.util';
import { AuthorizationToken } from './authorization/authorization.token';

export class RequestContext {
  static readonly NAMESPACE: string = 'local-storage';

  private correlationId: string;
  private authorizationToken: AuthorizationToken;
  private customerId: string;

  constructor() {}

  setCorrelationId(correlationId: string): void {
    this.correlationId = correlationId ? correlationId : StringUtil.EMPTY;
  }

  static getCorrelationId(): string {
    return RequestContext.get() ? RequestContext.get().correlationId : StringUtil.EMPTY;
  }

  setAuthorizationToken(authorizationToken: AuthorizationToken): void {
    this.authorizationToken = authorizationToken;
  }

  setCustomerId(customerId: string): void {
    this.customerId = customerId;
  }

  static getAuthorizationToken(): AuthorizationToken {
    return RequestContext.get() ? RequestContext.get().authorizationToken : null;
  }

  static getCustomerId(): string {
    return RequestContext.get() ? RequestContext.get().customerId : null;
  }

  static get(): RequestContext {
    const localStorage: Namespace = LocalStorageUtil.getOrCreate(RequestContext.NAMESPACE);
    if (localStorage && localStorage.active) {
      return localStorage.get(RequestContext.name);
    }

    return null;
  }
}
