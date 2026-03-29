import { logger } from '../../src/utils/logger';
import { processIncomingWebhook, verifyWebhookSubscription } from '../../src/services/webhookService';
import { getHeaderValue } from '../../src/utils/http';
import { verifyWebhookSignature } from '../../src/services/webhookSecurityService';

type NetlifyFunctionEvent = {
  httpMethod: string;
  body: string | null;
  headers?: Record<string, string | undefined> | null;
  isBase64Encoded?: boolean;
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
    const rawBody =
      event.body === null
        ? '{}'
        : event.isBase64Encoded
          ? Buffer.from(event.body, 'base64').toString('utf8')
          : event.body;
    const signature = verifyWebhookSignature(
      rawBody,
      getHeaderValue(event.headers ?? {}, 'x-hub-signature-256'),
    );

    if (!signature.isValid) {
      logger.warn({ reason: signature.reason }, 'Rejected webhook with invalid signature');
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Invalid webhook signature' }),
      };
    }

    if (!signature.enforced) {
      logger.warn('WHATSAPP_APP_SECRET is not configured; webhook signature verification is disabled');
    }

    let payload: unknown = {};

    try {
      payload = JSON.parse(rawBody) as unknown;
    } catch (error: unknown) {
      logger.warn({ err: error }, 'Invalid webhook JSON payload');
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Invalid JSON payload' }),
      };
    }

    const result = await processIncomingWebhook(payload, { rawBody });

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
