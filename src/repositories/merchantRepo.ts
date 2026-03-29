import { prisma } from '../lib/prisma';

export const getOrCreateDefaultMerchant = async (name: string, brandSlug: string) => {
  return prisma.merchant.upsert({
    where: { brandSlug },
    update: {
      name,
      status: 'active',
    },
    create: {
      name,
      brandSlug,
      status: 'active',
    },
  });
};

export const getDefaultMerchant = async (brandSlug: string) => {
  return prisma.merchant.findUnique({
    where: { brandSlug },
  });
};
