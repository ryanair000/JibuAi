import { prisma } from '../lib/prisma';
import { toJsonValue } from '../utils/json';

type CreateMessageInput = {
  conversationId: string;
  direction: 'inbound' | 'outbound';
  senderPhone: string;
  messageType: string;
  providerMessageId?: string;
  textBody?: string | null;
  rawPayload: unknown;
  intent?: string | null;
};

export const createMessage = async (input: CreateMessageInput) => {
  return prisma.message.create({
    data: {
      conversationId: input.conversationId,
      direction: input.direction,
      senderPhone: input.senderPhone,
      messageType: input.messageType,
      providerMessageId: input.providerMessageId,
      textBody: input.textBody ?? null,
      rawPayload: toJsonValue(input.rawPayload),
      intent: input.intent ?? null,
    },
  });
};

export const createInboundMessage = async (
  input: Omit<CreateMessageInput, 'direction'>,
) => {
  return createMessage({
    ...input,
    direction: 'inbound',
  });
};

export const createOutboundMessage = async (
  input: Omit<CreateMessageInput, 'direction'>,
) => {
  return createMessage({
    ...input,
    direction: 'outbound',
  });
};
