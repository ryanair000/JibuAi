import dotenv from 'dotenv';

dotenv.config();

const parsePort = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parsePort(process.env.PORT, 3000),
  appBaseUrl: process.env.APP_BASE_URL ?? 'http://localhost:3000',
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN ?? 'jibu_verify_2025',
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  databaseUrl: process.env.DATABASE_URL,
  defaultMerchantName: process.env.DEFAULT_MERCHANT_NAME ?? 'Jibu AI Pilot',
  defaultMerchantSlug: process.env.DEFAULT_MERCHANT_SLUG ?? 'jibu-ai-pilot',
};
