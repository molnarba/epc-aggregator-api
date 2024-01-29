import { Plugin } from '@nestjs/apollo';
import { ApolloServerPlugin, GraphQLRequestContext, GraphQLRequestListener } from 'apollo-server-plugin-base';
import { MonitoringService } from './monitoring.service';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { SharedConstants } from '../shared/shared.constants';
import { GraphQLResponse } from 'apollo-server-types';

@Plugin()
@Injectable()
export class MonitorRequestPlugin implements ApolloServerPlugin {
  private static readonly DEFAULT_OPERATION = 'NO_NAME';
  private static readonly DEFAULT_STATUS_CODE = 200;

  constructor(
    private readonly monitoringService: MonitoringService,
    @Inject(SharedConstants.LOGGER_PROVIDER) private readonly loggerService: LoggerService
  ) {}

  async requestDidStart(requestContext: GraphQLRequestContext<any>): Promise<GraphQLRequestListener> {
    // before request start code
    const startTime = process.hrtime.bigint();
    const monServiceFunc = (duration, operationName, httpStatusCode) => {
      this.monitoringService.duration(duration, operationName, MonitorRequestPlugin.name);
      this.monitoringService.increment(operationName, MonitorRequestPlugin.name, {
        httpStatusCode,
      });
    };

    const extractHttpStatusCode = (response: GraphQLResponse) => {
      return (
        response.errors?.map((error) => error.extensions).pop()?.['exception']?.['statusCode'] ??
        MonitorRequestPlugin.DEFAULT_STATUS_CODE
      );
    };
    return {
      async willSendResponse(context) {
        const operationName = context.operationName || MonitorRequestPlugin.DEFAULT_OPERATION;
        const httpStatusCode = extractHttpStatusCode(context.response);
        monServiceFunc(process.hrtime.bigint() - startTime, operationName, httpStatusCode);
      },
    };
  }
}
