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

## Git Auto Deploy

Git-based production deploys are configured through GitHub Actions in `.github/workflows/netlify-production.yml`.

Before pushes to `main` can deploy automatically, add this GitHub Actions secret in the repository settings:

- `NETLIFY_AUTH_TOKEN`

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

## Security

Webhook signature verification is implemented for the `X-Hub-Signature-256` header and becomes active as soon as `WHATSAPP_APP_SECRET` is configured.

Retry safety is also enabled:

- webhook payloads are fingerprinted with a SHA-256 payload hash
- duplicate webhook deliveries are ignored safely
- duplicate provider message IDs do not create duplicate replies

## FAQ automation

The seed script creates starter merchant FAQs for the pilot merchant. Incoming text messages are matched against trusted FAQ questions, and Jibu AI replies when a strong FAQ match is found.

If no FAQ match is found, the bot can send a fallback handoff reply using `DEFAULT_FALLBACK_REPLY`.

If `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` are not configured, the app still reports the matched FAQ in the webhook response but skips sending the reply.

## Admin API

The project exposes a token-protected internal read API for operational visibility:

- `GET /admin/conversations?limit=20`
- `GET /admin/messages?limit=50&conversationId=<optional>`
- `GET /admin/webhook-events?limit=20`

Set `ADMIN_API_TOKEN` and pass it as either:

- `Authorization: Bearer <ADMIN_API_TOKEN>`
- `x-admin-token: <ADMIN_API_TOKEN>`
