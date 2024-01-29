import { Global, Module } from '@nestjs/common';
import { HealthController } from './healthcheck.controller';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';

@Global()
@Module({
  // modules that export providers which are required by this module
  imports: [
    TerminusModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  // providers instantiated by this module
  providers: [],
  // controllers/endpoints instantiated by this module
  controllers: [HealthController],
})
export class HealthcheckModule {}
