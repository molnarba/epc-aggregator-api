import { StoryblokAdapter } from './outer/adapter/storyblok.adapter';

export const CMS_PROVIDER = 'CmsPort';
export const interfaceProviders = [{ provide: CMS_PROVIDER, useClass: StoryblokAdapter }];
