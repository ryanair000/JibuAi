# Jibu AI

Minimal Node.js + TypeScript WhatsApp support backend for the Jibu AI MVP, deployed on Netlify.

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Copy the env file and fill in your values:

```bash
Copy-Item .env.example .env
```

3. Start the server:

```bash
npm run dev
```

4. Generate the Prisma client:

```bash
npm run prisma:generate
```

## Endpoints

- `GET /health`
- `GET /webhook`
- `POST /webhook`

## Meta webhook verification

Set the callback URL to:

```text
https://jibuai.qybrrlabs.africa/webhook
```

Set the verify token to match `WHATSAPP_VERIFY_TOKEN` in your environment.

## Netlify

This project includes Netlify Functions and redirects in `netlify.toml`, so Netlify serves:

- `GET /health`
- `GET /webhook`
- `POST /webhook`

Production URL:

```text
https://jibuai.qybrrlabs.africa
```

## Persistence

When `DATABASE_URL` is configured, inbound webhook requests are normalized and persisted with Prisma into:

- `merchants`
- `customers`
- `conversations`
- `messages`
- `webhook_events`
- `merchant_faqs`

The default pilot merchant is created automatically from:

- `DEFAULT_MERCHANT_NAME`
- `DEFAULT_MERCHANT_SLUG`

Useful commands:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
```

## FAQ automation

The seed script creates starter merchant FAQs for the pilot merchant. Incoming text messages are matched against trusted FAQ questions, and Jibu AI replies only when a strong FAQ match is found.

If `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` are not configured, the app still reports the matched FAQ in the webhook response but skips sending the reply.
