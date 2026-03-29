import { env } from '../config/env';
import { createOutboundMessage } from '../repositories/messageRepo';
import { findFaqMatch } from './faqService';
import { sendWhatsAppTextMessage } from './outboundWhatsAppService';
import { persistWebhookPayload } from './webhookPersistenceService';

type VerificationQuery = Record<string, unknown>;
type AutomationResult = {
  senderPhone: string;
  action:
    | 'faq_replied'
    | 'faq_match_found_but_not_sent'
    | 'faq_no_match'
    | 'ignored_non_text';
  matchedQuestion?: string;
  replyText?: string;
  score?: number;
  reason?: string;
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

export const processIncomingWebhook = async (payload: unknown) => {
  const persistence = await persistWebhookPayload(payload);
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
      automations.push({
        senderPhone: message.senderPhone,
        action: 'faq_no_match',
      });
      continue;
    }

    const sendResult = await sendWhatsAppTextMessage({
      to: message.senderPhone,
      body: faqMatch.answer,
    });

    if (sendResult.sent) {
      if (env.databaseUrl) {
        await createOutboundMessage({
          conversationId: message.conversationId,
          senderPhone: env.whatsappPhoneNumberId ?? 'jibu-ai',
          messageType: 'text',
          providerMessageId: sendResult.providerMessageId,
          textBody: faqMatch.answer,
          rawPayload: {
            request: {
              to: message.senderPhone,
              body: faqMatch.answer,
            },
            response: sendResult.responseBody ?? {},
          },
          intent: 'faq',
        });
      }

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
