import { env } from '../config/env';
import { logger } from '../utils/logger';

type SendTextMessageInput = {
  to: string;
  body: string;
};

type SendTextMessageResult = {
  sent: boolean;
  reason?: 'credentials_not_configured' | 'meta_api_error';
  providerMessageId?: string;
  responseBody?: unknown;
};

export const sendWhatsAppTextMessage = async (
  input: SendTextMessageInput,
): Promise<SendTextMessageResult> => {
  if (!env.whatsappAccessToken || !env.whatsappPhoneNumberId) {
    return {
      sent: false,
      reason: 'credentials_not_configured',
    };
  }

  const response = await fetch(
    `https://graph.facebook.com/v23.0/${env.whatsappPhoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.whatsappAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: input.to,
        type: 'text',
        text: {
          body: input.body,
        },
      }),
    },
  );

  const responseBody = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    logger.error({ responseBody }, 'WhatsApp send-message request failed');
    return {
      sent: false,
      reason: 'meta_api_error',
      responseBody,
    };
  }

  const providerMessageId =
    Array.isArray(responseBody.messages) &&
    responseBody.messages.length > 0 &&
    typeof responseBody.messages[0] === 'object' &&
    responseBody.messages[0] !== null &&
    'id' in responseBody.messages[0] &&
    typeof responseBody.messages[0].id === 'string'
      ? responseBody.messages[0].id
      : undefined;

  return {
    sent: true,
    providerMessageId,
    responseBody,
  };
};
