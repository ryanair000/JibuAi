import express from 'express';
import pinoHttp from 'pino-http';

import { healthRouter } from './routes/health';
import { webhookRouter } from './routes/webhook';
import { logger } from './utils/logger';

export const createApp = () => {
  const app = express();

  app.use(
    pinoHttp({
      logger,
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  app.use('/health', healthRouter);
  app.use('/webhook', webhookRouter);

  app.use((req, res) => {
    req.log.warn({ method: req.method, url: req.originalUrl }, 'Route not found');
    res.status(404).json({ error: 'Not found' });
  });

  return app;
};
