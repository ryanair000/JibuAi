import { Router } from 'express';

import { receiveWebhookEvent, verifyWebhook } from '../controllers/webhookController';

export const webhookRouter = Router();

webhookRouter.get('/', verifyWebhook);
webhookRouter.post('/', receiveWebhookEvent);
