import { Module } from '@nestjs/common';
import { PortDefinitionsService } from './port-definitions.service';

@Module({
  providers: [PortDefinitionsService],
  exports: [PortDefinitionsService],
})
export class PortDefinitionsModule {}
