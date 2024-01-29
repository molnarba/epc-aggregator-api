import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { StatsD } from 'hot-shots';
import { MonitoringClient } from './monitoring.client';
import { SharedConstants } from '../shared/shared.constants';

@Injectable()
export class MonitoringService {
  readonly METRIC_TIMINGS: string = 'timings';
  readonly METRIC_COUNTERS: string = 'counters';
  readonly METRIC_GAUGES: string = 'gauges';

  private metrics: StatsD;

  constructor(
    @Inject(SharedConstants.LOGGER_PROVIDER) private readonly loggerService: LoggerService,
    private readonly monitoringClient: MonitoringClient
  ) {
    this.metrics = monitoringClient.metrics;
  }

  duration(duration: number, method: string, clazz: string): void {
    this.loggerService.verbose(
      `Sending duration metric to StatsD for key '${this.METRIC_TIMINGS}' with duration ${duration}`,
      MonitoringService.name
    );
    this.metrics.timing(this.METRIC_TIMINGS, duration, { method: method, class: clazz });
  }

  gauge(value: number, method: string, clazz: string): void {
    this.loggerService.verbose(
      `Sending gauge metric to StatsD for key '${this.METRIC_GAUGES}' with value $value`,
      MonitoringService.name
    );
    this.metrics.gauge(this.METRIC_GAUGES, value, { method: method, class: clazz });
  }

  increment(method: string, clazz: string, additionalTags?: any): void {
    this.loggerService.verbose(
      `Sending increment metric to StatsD for key '${this.METRIC_COUNTERS}'`,
      MonitoringService.name
    );
    this.metrics.increment(this.METRIC_COUNTERS, { method: method, class: clazz, ...additionalTags });
  }

  count(delta: number, method: string, clazz: string): void {
    this.loggerService.verbose(
      `Sending count metric to StatsD for key '${this.METRIC_COUNTERS}' with delta $delta`,
      MonitoringService.name
    );
    this.metrics.increment(this.METRIC_COUNTERS, delta, { method: method, class: clazz });
  }
}
