import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigurationService } from '../shared/configuration/configuration.service';
import { MonitoringService } from './monitoring.service';

/**
 * Used for monitoring of REST routes.
 * @deprecated
 */
@Injectable()
export class MonitoringMiddleware implements NestMiddleware {
  constructor(
    private readonly configurationService: ConfigurationService,
    private readonly monitoringService: MonitoringService
  ) {}

  use(req: Request, res: Response, next: Function) {
    const startTime: Date = new Date();
    const self = this;
    const end = res.end;

    res.end(() => {
      end.apply(res, arguments);

      let route: string = 'undefined';
      if (
        req.route != null &&
        req.route.path != null &&
        (typeof req.route.path === 'string' || req.route.path instanceof String)
      ) {
        route = req.route.path;
      } else if (req.url != null) {
        route = req.url;
      }

      if (route === '/') {
        route = 'root';
      }

      route = route
        .replace(/:/g, '_')
        .replace(/\//g, '_')
        .replace(/,/g, '_')
        .replace(/=/g, '_')
        .split('_')
        .filter(function (item, pos, self) {
          return self.indexOf(item) == pos;
        })
        .join('_')
        .replace(/^_/, '')
        .replace(/_$/, '')
        .toLowerCase();

      const endTime = new Date();
      const durationMillis = endTime.getMilliseconds() - startTime.getMilliseconds();

      self.monitoringService.duration(durationMillis, route, MonitoringMiddleware.name);
    });

    next();
  }
}
