import { prisma } from '../lib/prisma';

export const getOrCreateConversationForPhone = async (
  merchantId: string,
  phoneNumber: string,
) => {
  const customer = await prisma.customer.upsert({
    where: {
      merchantId_phoneNumber: {
        merchantId,
        phoneNumber,
      },
    },
    update: {},
    create: {
      merchantId,
      phoneNumber,
    },
  });

  const conversation = await prisma.conversation.upsert({
    where: {
      merchantId_customerId_channel: {
        merchantId,
        customerId: customer.id,
        channel: 'whatsapp',
      },
    },
    update: {
      lastMessageAt: new Date(),
    },
    create: {
      merchantId,
      customerId: customer.id,
      channel: 'whatsapp',
      status: 'open',
      lastMessageAt: new Date(),
    },
  });

  return { customer, conversation };
};

export const updateConversationStatus = async (conversationId: string, status: string) => {
  return prisma.conversation.update({
    where: {
      id: conversationId,
    },
    data: {
      status,
    },
  });
};
