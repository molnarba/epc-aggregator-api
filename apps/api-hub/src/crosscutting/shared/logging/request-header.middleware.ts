import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request } from 'express';
import { RequestContext } from '../request-context';
import { Namespace } from 'cls-hooked';
import { LocalStorageUtil } from '../../util/local-storage.util';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestHeaderMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: Function) {
    const correlationId: string = request.rawHeaders['x-correlation-id'] || randomUUID();

    const requestContext: RequestContext = new RequestContext();
    requestContext.setCorrelationId(correlationId);

    request.headers['x-correlation-id'] = correlationId;

    const localStorage: Namespace = LocalStorageUtil.getOrCreate(RequestContext.NAMESPACE);
    localStorage.bindEmitter(request);

    localStorage.run(async () => {
      localStorage.set(RequestContext.name, requestContext);
      next();
    });
  }
}
