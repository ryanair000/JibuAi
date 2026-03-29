import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const app = createApp();

app.listen(env.port, () => {
  logger.info(
    {
      port: env.port,
      baseUrl: env.appBaseUrl,
      nodeEnv: env.nodeEnv,
    },
    'Jibu AI server listening',
  );
});
