import { logger } from '../../src/utils/logger';
import { processIncomingWebhook, verifyWebhookSubscription } from '../../src/services/webhookService';

type NetlifyFunctionEvent = {
  httpMethod: string;
  body: string | null;
  queryStringParameters?: Record<string, string | undefined> | null;
};

export const handler = async (event: NetlifyFunctionEvent) => {
  if (event.httpMethod === 'GET') {
    const verification = verifyWebhookSubscription(event.queryStringParameters ?? {});

    if (verification.isValid) {
      logger.info({ mode: verification.mode }, 'Webhook verified successfully');
      return {
        statusCode: 200,
        body: verification.challenge,
      };
    }

    logger.warn({ mode: verification.mode }, 'Webhook verification failed');
    return {
      statusCode: 403,
      body: 'Forbidden',
    };
  }

  if (event.httpMethod === 'POST') {
    const payload = event.body ? (JSON.parse(event.body) as unknown) : {};
    const result = await processIncomingWebhook(payload);

    logger.info({ result }, 'Received webhook event');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ received: true, ...result }),
    };
  }

  return {
    statusCode: 405,
    headers: {
      Allow: 'GET, POST',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ error: 'Method not allowed' }),
  };
};
