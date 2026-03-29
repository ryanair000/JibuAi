import { prisma } from '../lib/prisma';
import { toJsonValue } from '../utils/json';

const isDuplicatePayloadHash = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === 'P2002';

export const createWebhookEvent = async (
  payload: unknown,
  payloadHash: string,
  eventType?: string,
) => {
  try {
    const event = await prisma.webhookEvent.create({
      data: {
        eventType: eventType ?? null,
        payload: toJsonValue(payload),
        payloadHash,
        status: 'received',
      },
    });

    return {
      event,
      isDuplicate: false,
    };
  } catch (error: unknown) {
    if (!isDuplicatePayloadHash(error)) {
      throw error;
    }

    const existingEvent = await prisma.webhookEvent.findUniqueOrThrow({
      where: {
        payloadHash,
      },
    });

    if (existingEvent.status === 'failed') {
      const retryEvent = await prisma.webhookEvent.update({
        where: {
          id: existingEvent.id,
        },
        data: {
          payload: toJsonValue(payload),
          eventType: eventType ?? existingEvent.eventType,
          processedAt: null,
          status: 'received',
        },
      });

      return {
        event: retryEvent,
        isDuplicate: false,
      };
    }

    const duplicateEvent = await prisma.webhookEvent.update({
      where: {
        id: existingEvent.id,
      },
      data: {
        duplicateCount: {
          increment: 1,
        },
      },
    });

    return {
      event: duplicateEvent,
      isDuplicate: true,
    };
  }
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

export const listRecentWebhookEvents = async (limit: number) => {
  return prisma.webhookEvent.findMany({
    take: limit,
    orderBy: {
      receivedAt: 'desc',
    },
    select: {
      id: true,
      eventType: true,
      status: true,
      payloadHash: true,
      duplicateCount: true,
      receivedAt: true,
      processedAt: true,
    },
  });
};
