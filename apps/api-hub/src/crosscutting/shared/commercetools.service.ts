import { Client, createClient, Middleware } from '@commercetools/sdk-client-v2';
import { createAuthMiddlewareForClientCredentialsFlow } from '@commercetools/sdk-middleware-auth';
import { createHttpMiddleware } from '@commercetools/sdk-middleware-http';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import fetch from 'cross-fetch';
import { ConfigurationService } from './configuration/configuration.service';
import SdkAuth from '@commercetools/sdk-auth';
import { RequestContext } from './request-context';
import { RedactionUtil } from '../util/redaction.util';
import { CommercetoolsTokenResponse } from '../../customers/outer/adapter/commercetools-token.response';
import { AuthorizationToken } from './authorization/authorization.token';
import { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk/dist/declarations/src/generated/client/by-project-key-request-builder';
import { ApiRoot, createApiBuilderFromCtpClient } from '@commercetools/platform-sdk';
import { SharedConstants } from './shared.constants';
import { MonitoringService } from '../monitoring/monitoring.service';

@Injectable()
export class CommercetoolsService {
  private readonly apiRoot: ApiRoot;
  private readonly client: Client;
  private readonly authClient: SdkAuth;
  private readonly authApiRoot: ApiRoot;

  constructor(
    private readonly configurationService: ConfigurationService,
    private readonly monitoringService: MonitoringService,
    @Inject(SharedConstants.LOGGER_PROVIDER) private readonly logger: LoggerService
  ) {
    const authMiddlewareForAccessToken: Middleware = this.authMiddlewareForAccessToken();
    const authMiddlewareForClientCredentials: Middleware = this.authMiddlewareForClientCredentials(
      configurationService.commercetoolsAuthUrl,
      configurationService.commercetoolsClientId,
      configurationService.commercetoolsClientSecret
    );
    const httpMiddleWare: Middleware = this.httpMiddleware(
      configurationService.commercetoolsApiUrl,
      configurationService.enableCommercetoolsQueryMonitoring
    );
    const loggerMiddleware: Middleware = this.loggerMiddleware();

    this.client = this.httpClientWith(
      authMiddlewareForAccessToken,
      authMiddlewareForClientCredentials,
      httpMiddleWare,
      loggerMiddleware
    );
    this.apiRoot = createApiBuilderFromCtpClient(this.client);

    const authClientScopes: string[] = this.bindAuthClientScopesToProjectKey(
      configurationService.commercetoolsProjectKey,
      configurationService.commercetoolsAuthClientScopes
    );
    this.authClient = this.httpAuthClient(
      configurationService.commercetoolsAuthUrl,
      configurationService.commercetoolsProjectKey,
      configurationService.commercetoolsAuthClientId,
      configurationService.commercetoolsAuthClientSecret,
      authClientScopes
    );
    this.authApiRoot = createApiBuilderFromCtpClient(this.authClient);
  }

  // NB: the 'authMiddlewareForAccessToken' *must* come before the 'authMiddlewareForClientCredentials',
  // because the middleware for client credentials will be skipped, if the request contains already an
  // authorization header!
  private httpClientWith(...middlewares: Middleware[]): Client {
    return createClient({
      middlewares,
    });
  }

  private bindAuthClientScopesToProjectKey(projectKey: string, customerScopes: string): Array<string> {
    const boundAuthScopes: Array<string> = new Array<string>();

    const inboundAuthScopes: string[] = customerScopes.split(',');
    for (const inboundAuthScope of inboundAuthScopes) {
      let unboundCustomerScope: string = inboundAuthScope.toLowerCase().trim();
      boundAuthScopes.push(`${unboundCustomerScope}:${projectKey}`);
    }

    return boundAuthScopes;
  }

  private httpAuthClient(
    authUrl: string,
    projectKey: string,
    clientId: string,
    clientSecret: string,
    authClientScopes: string[]
  ) {
    return new SdkAuth({
      host: authUrl,
      projectKey: projectKey,
      credentials: {
        clientId: clientId,
        clientSecret: clientSecret,
      },
      disableRefreshToken: false,
      scopes: authClientScopes,
      fetch,
    });
  }

  private httpMiddleware(apiUrl: string, enableCommercetoolsQueryMonitoring: boolean): Middleware {
    return createHttpMiddleware({
      host: apiUrl,
      fetch: !enableCommercetoolsQueryMonitoring ? fetch : this.customFetch(),
    });
  }

  private customFetch() {
    this.logger.log('Monitoring for commercetools requests is enabled.', CommercetoolsService.name);
    return (url: string, options: RequestInit) => {
      const startTime: Date = new Date();
      return fetch(url, options).finally(() => {
        const endTime = new Date();
        const durationMillis = endTime.getMilliseconds() - startTime.getMilliseconds();
        const parsedUrl = new URL(url);
        this.monitoringService.duration(durationMillis, parsedUrl.pathname, CommercetoolsService.name);
      });
    };
  }

  private authMiddlewareForAccessToken(): Middleware {
    return function (next) {
      return function (request, response) {
        const uriTemplateElements: string[] = request.uriTemplate !== undefined ? request.uriTemplate.split('/') : [];
        const needsAuthorization: boolean =
          uriTemplateElements.length >= 3 && uriTemplateElements[2].toLowerCase() === 'me';

        if (needsAuthorization) {
          const authorizationToken: AuthorizationToken = RequestContext.getAuthorizationToken();
          if (authorizationToken) {
            request.headers['Authorization'] = `${authorizationToken.type} ${authorizationToken.accessToken}`;
          }
        }

        next(request, response);
      };
    };
  }

  private loggerMiddleware(): Middleware {
    const self = this;

    return function (next) {
      return function (request, response) {
        var body = response.body,
          statusCode = response.statusCode;

        // create a copy of the request with censored values for logging
        const requestCopy = JSON.parse(JSON.stringify(request));
        const redactedHeaders = RedactionUtil.readactKeys(requestCopy.headers);
        const redactedQueryParams = RedactionUtil.readactKeys(requestCopy.queryParams);
        requestCopy.headers = redactedHeaders;
        requestCopy.queryParams = redactedQueryParams;

        self.logger.verbose("Commercetools request: '" + JSON.stringify(requestCopy) + "'", CommercetoolsService.name);
        self.logger.verbose(
          'Commercetools response (status: ' + statusCode + "): '" + JSON.stringify(body) + "'",
          CommercetoolsService.name
        );
        next(request, response);
      };
    };
  }

  private authMiddlewareForClientCredentials(authUrl: string, clientId: string, clientSecret: string) {
    return createAuthMiddlewareForClientCredentialsFlow({
      host: authUrl,
      projectKey: this.configurationService.commercetoolsProjectKey,
      credentials: {
        clientId: clientId,
        clientSecret: clientSecret,
      },
      fetch,
    });
  }

  public request(): ByProjectKeyRequestBuilder {
    return this.apiRoot.withProjectKey({
      projectKey: this.configurationService.commercetoolsProjectKey,
    });
  }

  public execute(request) {
    return this.client.execute(request);
  }

  public obtainAccessToken(username: string, password: string): Promise<CommercetoolsTokenResponse> {
    return this.authClient.customerPasswordFlow({
      username: username,
      password: password,
    });
  }

  public obtainAnonymousAccessToken(anonymousId: string): Promise<CommercetoolsTokenResponse> {
    return this.authClient.anonymousFlow(anonymousId);
  }

  public refreshAccessToken(refreshToken: string): Promise<CommercetoolsTokenResponse> {
    return this.authClient.refreshTokenFlow(refreshToken);
  }
}
