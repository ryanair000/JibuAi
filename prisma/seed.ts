import { PrismaClient } from '@prisma/client';

import { env } from '../src/config/env';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  if (!env.databaseUrl) {
    throw new Error('DATABASE_URL is required to run the seed script.');
  }

  const merchant = await prisma.merchant.upsert({
    where: { brandSlug: env.defaultMerchantSlug },
    update: {
      name: env.defaultMerchantName,
      status: 'active',
    },
    create: {
      name: env.defaultMerchantName,
      brandSlug: env.defaultMerchantSlug,
      status: 'active',
    },
  });

  const faqSeed = [
    {
      question: 'How much is delivery in Nairobi?',
      answer: 'Delivery within Nairobi is KES 300.',
      category: 'delivery',
    },
    {
      question: 'How long does delivery take?',
      answer: 'Orders within Nairobi usually arrive in 1 to 2 business days.',
      category: 'delivery',
    },
    {
      question: 'Do you offer exchanges?',
      answer: 'Yes. We accept exchanges within 3 days as long as the item is unworn and in its original condition.',
      category: 'exchange',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We currently accept M-Pesa and bank transfer.',
      category: 'payment',
    },
    {
      question: 'Where are you located?',
      answer: 'We are an online-first store serving customers across Nairobi and Kenya.',
      category: 'store',
    },
    {
      question: 'Do you deliver outside Nairobi?',
      answer: 'Yes. We deliver outside Nairobi through courier, and delivery timelines vary by location.',
      category: 'delivery',
    },
  ];

  for (const faq of faqSeed) {
    await prisma.merchantFaq.upsert({
      where: {
        merchantId_question: {
          merchantId: merchant.id,
          question: faq.question,
        },
      },
      update: {
        answer: faq.answer,
        category: faq.category,
        isActive: true,
      },
      create: {
        merchantId: merchant.id,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        isActive: true,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
