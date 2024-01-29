import { Module } from '@nestjs/common';
import { CmsResolver } from './inner/resolver/cms.resolver';
import { interfaceProviders } from './interface-provider-config';

@Module({
  providers: [...interfaceProviders, CmsResolver],
})
export class CmsModule {}
