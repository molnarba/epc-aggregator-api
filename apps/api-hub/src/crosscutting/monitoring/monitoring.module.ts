import { Global, Module } from '@nestjs/common';
import { MonitoringService } from 'apps/api-hub/src/crosscutting/monitoring/monitoring.service';
import { MonitoringClient } from './monitoring.client';
import { MonitorRequestPlugin } from './monitoring.plugin';

@Global()
@Module({
  providers: [MonitoringClient, MonitoringService, MonitorRequestPlugin],
  exports: [MonitoringService, MonitoringClient],
})
export class MonitoringModule {}
