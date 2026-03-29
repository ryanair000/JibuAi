import { prisma } from '../lib/prisma';

export const listRecentConversations = async (limit: number) => {
  return prisma.conversation.findMany({
    take: limit,
    orderBy: [
      {
        lastMessageAt: 'desc',
      },
      {
        updatedAt: 'desc',
      },
    ],
    include: {
      merchant: {
        select: {
          id: true,
          name: true,
          brandSlug: true,
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
          phoneNumber: true,
        },
      },
      messages: {
        take: 1,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          direction: true,
          senderPhone: true,
          messageType: true,
          textBody: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
  });
};

export const listRecentMessages = async (limit: number, conversationId?: string) => {
  return prisma.message.findMany({
    take: limit,
    where: conversationId
      ? {
          conversationId,
        }
      : undefined,
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      conversationId: true,
      direction: true,
      senderPhone: true,
      messageType: true,
      providerMessageId: true,
      textBody: true,
      intent: true,
      createdAt: true,
    },
  });
};
