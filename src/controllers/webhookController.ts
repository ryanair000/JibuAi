import type { Request, Response } from 'express';

import { getHeaderValue } from '../utils/http';
import { logger } from '../utils/logger';
import { processIncomingWebhook, verifyWebhookSubscription } from '../services/webhookService';
import { verifyWebhookSignature } from '../services/webhookSecurityService';

type RequestWithRawBody = Request & {
  rawBody?: string;
};

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
  const rawBody = (req as RequestWithRawBody).rawBody ?? JSON.stringify(req.body ?? {});
  const signature = verifyWebhookSignature(
    rawBody,
    getHeaderValue(req.headers, 'x-hub-signature-256'),
  );

  if (!signature.isValid) {
    req.log.warn({ reason: signature.reason }, 'Rejected webhook with invalid signature');
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  if (!signature.enforced) {
    req.log.warn('WHATSAPP_APP_SECRET is not configured; webhook signature verification is disabled');
  }

  const result = await processIncomingWebhook(req.body, { rawBody });

  req.log.info({ result }, 'Received webhook event');
  return res.status(200).json({ received: true, ...result });
};
