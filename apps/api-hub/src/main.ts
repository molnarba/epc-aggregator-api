import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import * as helmet from 'helmet';
import { ConfigurationService } from './crosscutting/shared/configuration/configuration.service';

declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configurationService = app.get(ConfigurationService);

  app.use(
    helmet.default({
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    })
  );

  app.enableCors({
    // CORS header 'Access-Control-Allow-Origin'
    origin: configurationService.corsWhiteList?.length > 0 ?? configurationService.corsWhiteList,
    // CORS header 'Access-Control-Allow-Credentials'
    credentials: true,
  });
  // set Pino as the app logger
  app.useLogger(app.get(Logger));
  enableHotReload(app);

  await app.listen(3000);
}

function enableHotReload(app: any) {
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}

bootstrap();
