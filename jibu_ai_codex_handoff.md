# Jibu AI — Codex Handoff

## 1. Project Summary

Jibu AI is a WhatsApp support automation product for fashion ecommerce brands. The first version should help merchants automate repetitive support conversations without losing the human touch.

### Core promise
- Automate repetitive WhatsApp support
- Keep complex cases with human staff
- Start with fashion ecommerce brands

### Initial use cases
1. FAQ automation
2. Order tracking
3. Payment confirmation intake
4. Human handoff / escalation
5. Optional: exchange request triage

### Initial brand positioning
**Jibu AI**  
**Automate support. Keep it personal.**

### Initial landing-page headline
**Automate repetitive WhatsApp support for ecommerce brands**

---

## 2. MVP Goal

Build the smallest useful product that can:
- receive incoming WhatsApp messages
- classify customer intent
- answer merchant-approved FAQ questions
- handle basic order tracking flows
- collect payment confirmation details
- escalate uncertain or sensitive cases to a human

### MVP success criteria
The MVP is successful if one pilot merchant can use it live and it demonstrably:
- reduces repetitive manual support work
- improves first response time
- handles common FAQs reliably
- safely escalates unclear or risky cases

---

## 3. Target Customer

### Primary ICP
Fashion ecommerce brands in Kenya / East Africa using WhatsApp as a core support or commerce channel.

### Best first segment
Women’s fashion boutiques using Instagram + WhatsApp + lightweight ecommerce/store operations.

### Buyer
- Founder
- Operations manager
- Customer support lead

### End users
- Customer messaging the store on WhatsApp
- Merchant support agent reviewing escalations
- Merchant admin configuring FAQs/policies

---

## 4. Scope

### In scope for V1
- Official WhatsApp Cloud API integration
- Webhook handling for inbound messages
- FAQ automation from approved merchant knowledge
- Order tracking workflow from simple data source
- Payment confirmation capture
- Escalation / handoff workflow
- Conversation logging
- Simple internal admin tools

### Out of scope for V1
- Full refunds automation
- Full CRM
- Omnichannel inbox
- Voice note support
- Recommendation engine
- Advanced analytics suite
- Multi-merchant self-serve onboarding
- Client-owned WhatsApp number onboarding
- Deep inventory integrations

---

## 5. Why official WhatsApp Cloud API

Use Meta’s official WhatsApp Business Platform Cloud API for production instead of an unofficial WhatsApp Web stack.

### Reasons
- It is the official transport layer for business messaging.
- Sending messages and receiving messages are supported through the Cloud API and webhooks.
- Receiving messages requires setting up webhooks.
- Business-initiated outbound messages later require approved templates.

### Practical interpretation for Jibu AI
- Use one Jibu AI-owned WhatsApp number first.
- Start with customer-initiated support conversations.
- Delay proactive outbound campaigns until templates are needed.

---

## 6. High-Level Architecture

```text
Customer on WhatsApp
    -> Meta WhatsApp Cloud API
    -> Webhook endpoint (our backend)
    -> Message parser / router
    -> Intent classifier + policy layer
    -> Tool layer (FAQ / order / payment / escalation)
    -> Response composer
    -> Meta send-message API
    -> Customer receives reply
```

### Core principle
The model should not directly control business actions. The model should help with:
- intent detection
- entity extraction
- response drafting from trusted data
- summarizing escalations

The backend should control:
- policy enforcement
- order lookup
- payment capture
- escalation rules
- outbound message sending

---

## 7. Recommended Tech Stack

### Transport
- Meta WhatsApp Business Platform Cloud API

### Backend
Choose one:
- Node.js + TypeScript + Express/Fastify
- or Python + FastAPI

**Recommendation for Codex:** Node.js + TypeScript + Express

### Database
- PostgreSQL
- or Supabase Postgres

### Queue / background jobs
- Start simple without a queue if traffic is low
- Later: BullMQ / Redis or a hosted queue

### AI / LLM
- Qwen 3.5
- Use function/tool calling style, not unconstrained freeform answers

### Hosting
- Railway / Render / Fly.io / VPS

### Secrets
- .env for local
- managed secrets in production

### File storage
- S3-compatible storage or Supabase Storage for payment screenshots

---

## 8. AI Role (Qwen 3.5)

Qwen should be used as a constrained assistant, not as a freeform autonomous support agent.

### Allowed responsibilities
- classify intent
- extract structured fields from user messages
- choose which tool/workflow to invoke
- draft concise WhatsApp-friendly responses
- produce escalation summaries

### Disallowed responsibilities
- invent policies
- invent order status
- invent payment status
- decide refunds autonomously
- decide exceptions outside policy

### Required tool categories
1. `faq_lookup`
2. `order_lookup`
3. `payment_capture`
4. `handoff_to_human`
5. optional `exchange_capture`

---

## 9. Core User Journeys

### 9.1 FAQ flow
**Customer:** “How much is delivery in Nairobi?”

Flow:
1. webhook receives message
2. classifier marks it as `faq`
3. system calls `faq_lookup`
4. system sends approved answer
5. if answer unavailable, escalate

### 9.2 Order tracking flow
**Customer:** “Where is my order?”

Flow:
1. classifier marks `order_tracking`
2. system asks for order number or phone number
3. customer replies with identifier
4. system calls `order_lookup`
5. system returns structured status
6. if order not found, escalate

### 9.3 Payment confirmation flow
**Customer:** “I have paid”

Flow:
1. classifier marks `payment_confirmation`
2. system asks for payment reference or screenshot
3. system stores record via `payment_capture`
4. system confirms receipt
5. support reviews later

### 9.4 Escalation flow
Escalate when:
- low confidence
- angry/frustrated user
- refund/dispute case
- order not found
- repeated misunderstanding
- unsupported policy exception

---

## 10. Merchant Data Needed for Onboarding

For each merchant, collect:

### Business profile
- brand name
- support phone number
- support hours
- escalation contact

### Policies / knowledge
- delivery policy
- shipping fees
- payment methods
- exchange policy
- FAQs

### Operations data
- order status source
- payment review process
- escalation process

### V1 onboarding method
- manual onboarding form
- admin dashboard form
- seed data via CSV / sheet upload later

---

## 11. Functional Requirements

### 11.1 WhatsApp webhook handler
Must support:
- `GET /webhook` for verification
- `POST /webhook` for actual events

### 11.2 Inbound message parser
Must:
- parse sender phone number
- parse message type
- extract text body
- ignore unsupported event types safely
- store raw event for debugging

### 11.3 Intent classification
Must classify into:
- faq
- order_tracking
- payment_confirmation
- exchange_request
- unknown
- human_required

### 11.4 FAQ response engine
Must:
- use merchant-approved answers only
- support semantic matching or rule-based matching
- avoid hallucination
- escalate if confidence is low

### 11.5 Order lookup flow
Must:
- request missing order identifier
- look up order from simple source
- return structured status
- escalate if no record exists

### 11.6 Payment confirmation capture
Must:
- request payment reference and/or screenshot
- store pending submission
- mark it for human review
- send confirmation to customer

### 11.7 Escalation system
Must:
- create escalation record
- include customer context + summary
- stop risky automated replies
- notify internal staff later

### 11.8 Logging
Must store:
- inbound message
- outbound reply
- classification
- tool call results
- escalation flag
- timestamps

---

## 12. Non-Functional Requirements

- safe under uncertainty
- easy to debug
- fast enough for near-real-time chat
- easy to configure per merchant
- secrets kept out of source control
- simple enough for one pilot merchant first

---

## 13. Backend Services

Recommended backend modules:

### 13.1 `webhook-service`
Responsibilities:
- handle Meta GET verification
- receive POST events
- validate request signature later
- normalize inbound event payloads

### 13.2 `message-router`
Responsibilities:
- route inbound messages to correct workflow
- avoid duplicate processing
- check whether conversation is merchant/test traffic

### 13.3 `intent-service`
Responsibilities:
- call Qwen for intent classification and extraction
- return structured intent result

### 13.4 `faq-service`
Responsibilities:
- search merchant knowledge base
- return canonical FAQ answer

### 13.5 `order-service`
Responsibilities:
- query order source
- normalize status response

### 13.6 `payment-service`
Responsibilities:
- create payment confirmation record
- attach screenshot if present
- mark review state

### 13.7 `escalation-service`
Responsibilities:
- create escalation ticket
- summarize context
- expose queue to internal dashboard

### 13.8 `outbound-whatsapp-service`
Responsibilities:
- send text replies via Cloud API
- send templates when needed later
- centralize error handling

---

## 14. Proposed Database Schema

### Table: `merchants`
- `id` UUID PK
- `name` text
- `brand_slug` text unique
- `whatsapp_phone_number` text nullable
- `support_hours` jsonb nullable
- `status` text
- `created_at` timestamptz
- `updated_at` timestamptz

### Table: `merchant_faqs`
- `id` UUID PK
- `merchant_id` UUID FK
- `question` text
- `answer` text
- `category` text nullable
- `is_active` boolean
- `created_at` timestamptz
- `updated_at` timestamptz

### Table: `merchant_policies`
- `id` UUID PK
- `merchant_id` UUID FK
- `policy_type` text
- `title` text
- `content` text
- `is_active` boolean
- `created_at` timestamptz
- `updated_at` timestamptz

### Table: `customers`
- `id` UUID PK
- `merchant_id` UUID FK
- `phone_number` text
- `name` text nullable
- `created_at` timestamptz
- `updated_at` timestamptz

### Table: `conversations`
- `id` UUID PK
- `merchant_id` UUID FK
- `customer_id` UUID FK
- `channel` text default `whatsapp`
- `status` text
- `last_message_at` timestamptz
- `created_at` timestamptz
- `updated_at` timestamptz

### Table: `messages`
- `id` UUID PK
- `conversation_id` UUID FK
- `direction` text (`inbound` / `outbound`)
- `sender_phone` text
- `message_type` text
- `text_body` text nullable
- `raw_payload` jsonb
- `intent` text nullable
- `created_at` timestamptz

### Table: `orders`
For MVP, this can be optional if reading from an external sheet/database.
If stored internally:
- `id` UUID PK
- `merchant_id` UUID FK
- `external_order_id` text
- `customer_phone` text
- `status` text
- `status_detail` text nullable
- `eta` text nullable
- `raw_source` jsonb nullable
- `created_at` timestamptz
- `updated_at` timestamptz

### Table: `payment_confirmations`
- `id` UUID PK
- `merchant_id` UUID FK
- `conversation_id` UUID FK
- `customer_id` UUID FK
- `reference` text nullable
- `amount` numeric nullable
- `screenshot_url` text nullable
- `status` text default `pending_review`
- `raw_payload` jsonb
- `created_at` timestamptz
- `updated_at` timestamptz

### Table: `escalations`
- `id` UUID PK
- `merchant_id` UUID FK
- `conversation_id` UUID FK
- `reason` text
- `summary` text
- `status` text default `open`
- `assigned_to` text nullable
- `created_at` timestamptz
- `updated_at` timestamptz

### Table: `webhook_events`
- `id` UUID PK
- `provider` text default `meta_whatsapp`
- `event_type` text nullable
- `payload` jsonb
- `received_at` timestamptz
- `processed_at` timestamptz nullable
- `status` text

---

## 15. Internal APIs / Service Interfaces

### `POST /webhook`
Receives Meta webhook events.

### `GET /webhook`
Handles verification challenge.

### `POST /internal/classify-message`
Internal only. Optional.

### `POST /internal/faq-lookup`
Input:
```json
{ "merchantId": "...", "question": "How much is delivery?" }
```

### `POST /internal/order-lookup`
Input:
```json
{ "merchantId": "...", "orderId": "JB123", "phone": "+2547..." }
```

### `POST /internal/payment-capture`
Input:
```json
{ "merchantId": "...", "phone": "+2547...", "reference": "ABC123" }
```

### `POST /internal/handoff`
Input:
```json
{ "merchantId": "...", "conversationId": "...", "reason": "order_not_found", "summary": "..." }
```

---

## 16. Minimal Project Structure (Node + TypeScript)

```text
jibu-ai/
  src/
    app.ts
    server.ts
    config/
      env.ts
    routes/
      webhook.ts
    controllers/
      webhookController.ts
    services/
      whatsappService.ts
      intentService.ts
      faqService.ts
      orderService.ts
      paymentService.ts
      escalationService.ts
      messageRouter.ts
    adapters/
      qwenClient.ts
      metaWhatsAppClient.ts
    repositories/
      merchantRepo.ts
      conversationRepo.ts
      messageRepo.ts
      paymentRepo.ts
      escalationRepo.ts
    utils/
      logger.ts
      phone.ts
      errors.ts
    prompts/
      classifyIntent.ts
      responsePolicy.ts
    types/
      webhook.ts
      messages.ts
      intents.ts
  prisma/
    schema.prisma
  .env.example
  package.json
  README.md
```

---

## 17. Environment Variables

```env
NODE_ENV=development
PORT=3000
APP_BASE_URL=http://localhost:3000

WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_WABA_ID=
WHATSAPP_VERIFY_TOKEN=jibu_verify_2025
WHATSAPP_APP_SECRET=

DATABASE_URL=

QWEN_BASE_URL=
QWEN_API_KEY=
QWEN_MODEL=

S3_BUCKET=
S3_REGION=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
```

Notes:
- `WHATSAPP_VERIFY_TOKEN` is self-chosen and must match what you enter in Meta webhook configuration.
- `WHATSAPP_APP_SECRET` is needed when implementing signature verification.

---

## 18. Meta WhatsApp Setup Notes

### What is already confirmed
- Meta app created
- WhatsApp use case selected
- temporary access token generated
- test message successfully delivered
- current test phone number ID captured
- current WABA ID captured

### Next setup step
Implement and expose webhook endpoint, then configure it in Meta.

### Webhook behavior
- Meta sends `GET /webhook` during verification.
- Server must compare `hub.verify_token` and return `hub.challenge`.
- Meta sends `POST /webhook` for incoming messages/events.
- Server processes event and separately calls Meta send-message API to reply.

---

## 19. Minimal Webhook Example (Node/Express)

```ts
import express from 'express';

const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'jibu_verify_2025';

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

app.post('/webhook', async (req, res) => {
  console.log(JSON.stringify(req.body, null, 2));
  return res.sendStatus(200);
});

app.listen(3000, () => {
  console.log('Server listening on 3000');
});
```

### Expected next iteration
- parse inbound message
- persist webhook event
- classify intent
- choose tool/action
- send outbound reply

---

## 20. Meta Send Message Example

```bash
curl -X POST "https://graph.facebook.com/v23.0/${WHATSAPP_PHONE_NUMBER_ID}/messages" \
  -H "Authorization: Bearer ${WHATSAPP_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "254XXXXXXXXX",
    "type": "text",
    "text": {
      "body": "Hello from Jibu AI"
    }
  }'
```

---

## 21. Qwen Integration Strategy

### Suggested prompt pattern
Use Qwen to produce structured output like:

```json
{
  "intent": "faq",
  "confidence": 0.93,
  "entities": {
    "order_id": null,
    "payment_reference": null
  },
  "should_escalate": false,
  "draft_reply": "Delivery within Nairobi is KES 300."
}
```

### System-level rules
- never invent policies
- never invent order status
- use tool results when available
- escalate if uncertain
- keep replies short and WhatsApp-friendly

### Tool-first approach
1. classify intent
2. fetch trusted data
3. draft response from trusted data
4. send or escalate

---

## 22. Response Policy

Every outbound message must follow:
- short
- polite
- clear
- brand-safe
- no unsupported claims
- no fabricated operational info

### Examples
Good:
- “Please share your order number so I can check the status.”
- “Thanks. I’ve received your payment reference and shared it with the support team for review.”

Bad:
- “Your order will arrive tomorrow” when the system has no order data.
- “Your payment has been confirmed” before human review.

---

## 23. Security / Reliability Checklist

### Must-do early
- do not commit access tokens
- rotate exposed temporary tokens
- verify webhook token
- implement Meta signature validation later
- store raw webhook payloads for debugging
- log outbound request failures

### Operational safety
- default to escalation when uncertain
- keep payment verification human-reviewed
- use one Jibu AI-owned number first

---

## 24. MVP Build Order for Codex

### Phase 1 — Project bootstrap
1. create Node + TypeScript project
2. add Express
3. add env/config loader
4. add logger
5. add webhook route
6. deploy locally

### Phase 2 — WhatsApp inbound foundation
1. implement `GET /webhook`
2. implement `POST /webhook`
3. log inbound payloads
4. deploy to public URL
5. verify webhook in Meta
6. test inbound receipt

### Phase 3 — Persistence
1. add Postgres/Prisma
2. create base schema
3. store merchants, conversations, messages, webhook events

### Phase 4 — FAQ workflow
1. seed merchant FAQs
2. build FAQ lookup service
3. build basic intent classifier
4. return FAQ responses automatically

### Phase 5 — Order tracking workflow
1. build order lookup adapter
2. handle missing order ID
3. return structured order status
4. escalate on no result

### Phase 6 — Payment capture workflow
1. detect payment confirmation intent
2. ask for ref/screenshot
3. store payment confirmation record
4. send acknowledgement

### Phase 7 — Escalation workflow
1. create escalation record
2. summarize context
3. expose internal escalation queue

### Phase 8 — Hardening
1. add signature validation
2. add idempotency / duplicate event protection
3. improve prompt/tool safety
4. add tests

---

## 25. Suggested Codex Task Breakdown

### Task 1
Bootstrap a Node.js TypeScript Express API with:
- `/health`
- `GET /webhook`
- `POST /webhook`
- env loading
- logging

### Task 2
Implement Meta WhatsApp webhook verification and a basic inbound event logger.

### Task 3
Add Prisma schema and migrations for:
- merchants
- conversations
- messages
- webhook_events
- escalations
- payment_confirmations

### Task 4
Create `metaWhatsAppClient.ts` for outbound message sending.

### Task 5
Create `qwenClient.ts` and `intentService.ts` for structured intent classification.

### Task 6
Implement `faqService.ts` and automatic FAQ reply flow.

### Task 7
Implement `orderService.ts` and order tracking flow with a stub/mock data source.

### Task 8
Implement `paymentService.ts` and pending review capture flow.

### Task 9
Implement escalation logic and internal dashboard JSON endpoints.

### Task 10
Write README with setup, env vars, Meta webhook setup, and local development instructions.

---

## 26. Example Milestone Definition

### Milestone 1
Webhook verified in Meta, inbound messages logged.

### Milestone 2
Merchant FAQ seeded, customer FAQ auto-replies working.

### Milestone 3
Order tracking flow works end-to-end.

### Milestone 4
Payment confirmation flow works end-to-end.

### Milestone 5
Escalations visible to internal support operator.

---

## 27. Open Decisions

Codex can move forward, but these should be finalized soon:
- Node vs FastAPI (recommend Node)
- Prisma vs raw SQL (recommend Prisma)
- Supabase vs self-managed Postgres
- exact Qwen deployment path
- whether order data lives internally or is read from merchant sheet/API
- how internal agents will review escalations

---

## 28. Recommended Immediate Next Step

Build the webhook server first.

### Exact next implementation target
- create server
- expose public webhook URL
- verify in Meta
- log inbound messages

Once that works, add FAQ automation before anything else.

---

## 29. Reference Notes for Implementation

### WhatsApp Cloud API
Meta’s official quickstart separates message sending from inbound receiving and notes that receiving messages requires webhooks.

### Webhook verification
Webhook verification uses `GET` with `hub.verify_token` and `hub.challenge`; successful verification returns the challenge.

### Templates
Business-initiated outbound messaging later requires approved templates.

### Qwen
Qwen supports function calling/tool-calling patterns, which fits the tool-first architecture recommended for Jibu AI.

---

## 30. Hand-off Summary for Codex

Build Jibu AI as a constrained WhatsApp support automation backend using the official Meta Cloud API, a webhook-based inbound flow, Qwen for structured intent + drafting, and backend-owned business logic for FAQ answers, order tracking, payment capture, and human escalation.

The first production-worthy outcome is not a general agent platform. It is a safe and reliable WhatsApp support assistant for one fashion ecommerce pilot merchant.
