import { prisma } from '../lib/prisma';
import { toJsonValue } from '../utils/json';

export const createWebhookEvent = async (payload: unknown, eventType?: string) => {
  return prisma.webhookEvent.create({
    data: {
      eventType: eventType ?? null,
      payload: toJsonValue(payload),
      status: 'received',
    },
  });
};

export const completeWebhookEvent = async (id: string, status: string) => {
  return prisma.webhookEvent.update({
    where: { id },
    data: {
      status,
      processedAt: new Date(),
    },
  });
};
