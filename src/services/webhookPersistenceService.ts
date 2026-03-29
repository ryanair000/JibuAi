import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { env } from '../config/env';
import { getOrCreateConversationForPhone } from '../repositories/conversationRepo';
import { createInboundMessage } from '../repositories/messageRepo';
import { getOrCreateDefaultMerchant } from '../repositories/merchantRepo';
import { completeWebhookEvent, createWebhookEvent } from '../repositories/webhookEventRepo';
import { logger } from '../utils/logger';
import { inferEventType, normalizeInboundMessages } from './metaWebhookNormalizer';

export type WebhookPersistenceResult = {
  persisted: boolean;
  reason?: 'database_not_configured' | 'no_supported_messages' | 'persistence_failed';
  eventType?: string;
  normalizedMessageCount: number;
  webhookEventId?: string;
  messages: PersistedInboundMessage[];
};

export type PersistedInboundMessage = {
  merchantId: string;
  conversationId: string;
  senderPhone: string;
  messageType: string;
  textBody: string | null;
  providerMessageId?: string;
};

const isDuplicateProviderMessage = (error: unknown): boolean =>
  error instanceof PrismaClientKnownRequestError && error.code === 'P2002';

export const persistWebhookPayload = async (
  payload: unknown,
): Promise<WebhookPersistenceResult> => {
  const eventType = inferEventType(payload);
  const normalizedMessages = normalizeInboundMessages(payload);

  if (!env.databaseUrl) {
    logger.warn('DATABASE_URL is not configured; skipping webhook persistence');
    return {
      persisted: false,
      reason: 'database_not_configured',
      eventType,
      normalizedMessageCount: normalizedMessages.length,
      messages: [],
    };
  }

  const webhookEvent = await createWebhookEvent(payload, eventType);

  try {
    if (normalizedMessages.length === 0) {
      await completeWebhookEvent(webhookEvent.id, 'ignored');
      return {
        persisted: true,
        reason: 'no_supported_messages',
        eventType,
        normalizedMessageCount: 0,
        webhookEventId: webhookEvent.id,
        messages: [],
      };
    }

    const merchant = await getOrCreateDefaultMerchant(
      env.defaultMerchantName,
      env.defaultMerchantSlug,
    );
    const persistedMessages: PersistedInboundMessage[] = [];

    for (const message of normalizedMessages) {
      const { conversation } = await getOrCreateConversationForPhone(
        merchant.id,
        message.senderPhone,
      );

      try {
        await createInboundMessage({
          conversationId: conversation.id,
          senderPhone: message.senderPhone,
          messageType: message.messageType,
          providerMessageId: message.providerMessageId,
          textBody: message.textBody,
          rawPayload: message.rawPayload,
        });
      } catch (error: unknown) {
        if (isDuplicateProviderMessage(error)) {
          logger.warn(
            { providerMessageId: message.providerMessageId },
            'Skipping duplicate inbound message',
          );
          continue;
        }

        throw error;
      }

      persistedMessages.push({
        merchantId: merchant.id,
        conversationId: conversation.id,
        senderPhone: message.senderPhone,
        messageType: message.messageType,
        textBody: message.textBody,
        providerMessageId: message.providerMessageId,
      });
    }

    await completeWebhookEvent(webhookEvent.id, 'processed');

    return {
      persisted: true,
      eventType,
      normalizedMessageCount: normalizedMessages.length,
      webhookEventId: webhookEvent.id,
      messages: persistedMessages,
    };
  } catch (error: unknown) {
    await completeWebhookEvent(webhookEvent.id, 'failed');
    logger.error({ err: error }, 'Failed to persist webhook payload');

    return {
      persisted: false,
      reason: 'persistence_failed',
      eventType,
      normalizedMessageCount: normalizedMessages.length,
      webhookEventId: webhookEvent.id,
      messages: [],
    };
  }
};
