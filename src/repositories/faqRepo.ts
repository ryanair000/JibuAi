import { prisma } from '../lib/prisma';

export const getActiveFaqsForMerchant = async (merchantId: string) => {
  return prisma.merchantFaq.findMany({
    where: {
      merchantId,
      isActive: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
};
