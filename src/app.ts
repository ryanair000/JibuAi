import express, { type Request } from 'express';
import pinoHttp from 'pino-http';

import { adminRouter } from './routes/admin';
import { healthRouter } from './routes/health';
import { webhookRouter } from './routes/webhook';
import { logger } from './utils/logger';

type RequestWithRawBody = Request & {
  rawBody?: string;
};

export const createApp = () => {
  const app = express();

  app.use(
    pinoHttp({
      logger,
    }),
  );
  app.use(
    express.json({
      limit: '1mb',
      verify: (req, _res, buf) => {
        (req as RequestWithRawBody).rawBody = buf.toString('utf8');
      },
    }),
  );

  app.use('/admin', adminRouter);
  app.use('/health', healthRouter);
  app.use('/webhook', webhookRouter);

  app.use((error: unknown, req: Request, res: express.Response, next: express.NextFunction) => {
    if (error instanceof SyntaxError) {
      req.log.warn({ err: error }, 'Invalid JSON payload');
      res.status(400).json({ error: 'Invalid JSON payload' });
      return;
    }

    next(error);
  });

  app.use((req, res) => {
    req.log.warn({ method: req.method, url: req.originalUrl }, 'Route not found');
    res.status(404).json({ error: 'Not found' });
  });

  return app;
};
