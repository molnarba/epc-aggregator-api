import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HttpHealthIndicator } from '@nestjs/terminus';
import { ConfigurationService } from '../../../shared/configuration/configuration.service';

@Controller('health')
export class HealthController {
  private readonly commercetoolsApiUrl: string;
  private readonly commercetoolsAuthUrl: string;

  constructor(
    private readonly configurationService: ConfigurationService,
    private readonly health: HealthCheckService,
    private readonly dns: HttpHealthIndicator
  ) {
    this.commercetoolsApiUrl = configurationService.commercetoolsApiUrl;
    this.commercetoolsAuthUrl = configurationService.commercetoolsAuthUrl;
  }

  @Get()
  @HealthCheck()
  public check() {
    return this.health.check([
      () => this.dns.pingCheck('sphere-api-ping', this.commercetoolsApiUrl),
      () => this.dns.pingCheck('sphere-auth-ping', this.commercetoolsAuthUrl),
    ]);
  }
}
