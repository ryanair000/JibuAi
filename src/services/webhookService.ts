import { env } from '../config/env';
import { updateConversationStatus } from '../repositories/conversationRepo';
import { createOutboundMessage } from '../repositories/messageRepo';
import { findFaqMatch } from './faqService';
import { sendWhatsAppTextMessage } from './outboundWhatsAppService';
import { persistWebhookPayload } from './webhookPersistenceService';

type VerificationQuery = Record<string, unknown>;
type AutomationResult = {
  senderPhone: string;
  action:
    | 'fallback_not_sent'
    | 'fallback_replied'
    | 'faq_replied'
    | 'faq_match_found_but_not_sent'
    | 'faq_no_match'
    | 'ignored_non_text';
  matchedQuestion?: string;
  replyText?: string;
  score?: number;
  reason?: string;
};

const storeOutboundAutomationMessage = async (input: {
  conversationId: string;
  recipientPhone: string;
  body: string;
  providerMessageId?: string;
  responseBody?: unknown;
  intent: 'faq' | 'fallback';
}) => {
  if (!env.databaseUrl) {
    return;
  }

  await createOutboundMessage({
    conversationId: input.conversationId,
    senderPhone: env.whatsappPhoneNumberId ?? 'jibu-ai',
    messageType: 'text',
    providerMessageId: input.providerMessageId,
    textBody: input.body,
    rawPayload: {
      request: {
        to: input.recipientPhone,
        body: input.body,
      },
      response: input.responseBody ?? {},
    },
    intent: input.intent,
  });
};

export const verifyWebhookSubscription = (query: VerificationQuery) => {
  const mode = query['hub.mode'];
  const token = query['hub.verify_token'];
  const challenge = query['hub.challenge'];

  return {
    isValid: mode === 'subscribe' && token === env.whatsappVerifyToken,
    challenge: String(challenge ?? ''),
    mode: typeof mode === 'string' ? mode : undefined,
  };
};

export const processIncomingWebhook = async (
  payload: unknown,
  options?: { rawBody?: string },
) => {
  const persistence = await persistWebhookPayload(payload, options?.rawBody);
  const automations: AutomationResult[] = [];

  for (const message of persistence.messages) {
    if (message.messageType !== 'text' || !message.textBody) {
      automations.push({
        senderPhone: message.senderPhone,
        action: 'ignored_non_text',
      });
      continue;
    }

    const faqMatch = await findFaqMatch(message.merchantId, message.textBody);

    if (!faqMatch) {
      const fallbackReply = env.defaultFallbackReply?.trim();

      if (!fallbackReply) {
        automations.push({
          senderPhone: message.senderPhone,
          action: 'faq_no_match',
        });
        continue;
      }

      const fallbackSendResult = await sendWhatsAppTextMessage({
        to: message.senderPhone,
        body: fallbackReply,
      });

      if (fallbackSendResult.sent) {
        await updateConversationStatus(message.conversationId, 'needs_human');
        await storeOutboundAutomationMessage({
          conversationId: message.conversationId,
          recipientPhone: message.senderPhone,
          body: fallbackReply,
          providerMessageId: fallbackSendResult.providerMessageId,
          responseBody: fallbackSendResult.responseBody,
          intent: 'fallback',
        });

        automations.push({
          senderPhone: message.senderPhone,
          action: 'fallback_replied',
          replyText: fallbackReply,
        });
        continue;
      }

      automations.push({
        senderPhone: message.senderPhone,
        action: 'fallback_not_sent',
        replyText: fallbackReply,
        reason: fallbackSendResult.reason,
      });
      await updateConversationStatus(message.conversationId, 'needs_human');
      continue;
    }

    const sendResult = await sendWhatsAppTextMessage({
      to: message.senderPhone,
      body: faqMatch.answer,
    });

    if (sendResult.sent) {
      await storeOutboundAutomationMessage({
        conversationId: message.conversationId,
        recipientPhone: message.senderPhone,
        body: faqMatch.answer,
        providerMessageId: sendResult.providerMessageId,
        responseBody: sendResult.responseBody,
        intent: 'faq',
      });

      automations.push({
        senderPhone: message.senderPhone,
        action: 'faq_replied',
        matchedQuestion: faqMatch.question,
        replyText: faqMatch.answer,
        score: faqMatch.score,
      });

      continue;
    }

    automations.push({
      senderPhone: message.senderPhone,
      action: 'faq_match_found_but_not_sent',
      matchedQuestion: faqMatch.question,
      replyText: faqMatch.answer,
      score: faqMatch.score,
      reason: sendResult.reason,
    });
  }

  return {
    persistence,
    automations,
  };
};
