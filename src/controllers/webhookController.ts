import type { Request, Response } from 'express';

import { logger } from '../utils/logger';
import { processIncomingWebhook, verifyWebhookSubscription } from '../services/webhookService';

export const verifyWebhook = (req: Request, res: Response): Response => {
  const verification = verifyWebhookSubscription(req.query as Record<string, unknown>);

  if (verification.isValid) {
    logger.info({ mode: verification.mode }, 'Webhook verified successfully');
    return res.status(200).send(verification.challenge);
  }

  logger.warn({ mode: verification.mode }, 'Webhook verification failed');
  return res.sendStatus(403);
};

export const receiveWebhookEvent = async (req: Request, res: Response): Promise<Response> => {
  const result = await processIncomingWebhook(req.body);

  req.log.info({ result }, 'Received webhook event');
  return res.status(200).json({ received: true, ...result });
};
