import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { ConfigurationService } from 'apps/api-hub/src/crosscutting/shared/configuration/configuration.service';
import { StatsD } from 'hot-shots';
import { SharedConstants } from '../shared/shared.constants';

/**
 * https://www.npmjs.com/package/hot-shots
 */
@Injectable()
export class MonitoringClient {
  private _metrics: StatsD;

  constructor(
    private readonly configurationService: ConfigurationService,
    @Inject(SharedConstants.LOGGER_PROVIDER) private readonly loggerService: LoggerService
  ) {
    this._metrics = new StatsD({
      host: this.configurationService.telegrafHost,
      port: this.configurationService.telegrafPort,
      protocol: 'udp',
      telegraf: true,
      globalTags: {
        service: this.configurationService.applicationName,
      },
      errorHandler: (error) => {
        this.loggerService.error(`hot-shots UDP error: '${error.message}'`, MonitoringClient.name);
      },
    });
    this.loggerService.log(
      `Initialized StatsD client to send application metrics to '${configurationService.telegrafHost}' on port ${configurationService.telegrafPort}`,
      MonitoringClient.name
    );
  }

  get metrics(): StatsD {
    return this._metrics;
  }
}
