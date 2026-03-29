type JsonRecord = Record<string, unknown>;

export type NormalizedInboundMessage = {
  senderPhone: string;
  messageType: string;
  textBody: string | null;
  providerMessageId?: string;
  rawPayload: unknown;
};

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

export const inferEventType = (payload: unknown): string | undefined => {
  if (!isRecord(payload)) {
    return undefined;
  }

  const entries = asArray(payload.entry);
  for (const entry of entries) {
    if (!isRecord(entry)) {
      continue;
    }

    const changes = asArray(entry.changes);
    for (const change of changes) {
      if (!isRecord(change)) {
        continue;
      }

      const field = change.field;
      if (typeof field === 'string' && field.length > 0) {
        return field;
      }
    }
  }

  return undefined;
};

export const normalizeInboundMessages = (payload: unknown): NormalizedInboundMessage[] => {
  if (!isRecord(payload)) {
    return [];
  }

  const normalized: NormalizedInboundMessage[] = [];
  const entries = asArray(payload.entry);

  for (const entry of entries) {
    if (!isRecord(entry)) {
      continue;
    }

    const changes = asArray(entry.changes);
    for (const change of changes) {
      if (!isRecord(change)) {
        continue;
      }

      const value = change.value;
      if (!isRecord(value)) {
        continue;
      }

      const messages = asArray(value.messages);
      for (const message of messages) {
        if (!isRecord(message)) {
          continue;
        }

        const senderPhone = typeof message.from === 'string' ? message.from : null;
        const messageType = typeof message.type === 'string' ? message.type : 'unknown';
        const providerMessageId = typeof message.id === 'string' ? message.id : undefined;

        let textBody: string | null = null;
        if (isRecord(message.text) && typeof message.text.body === 'string') {
          textBody = message.text.body;
        }

        if (!senderPhone) {
          continue;
        }

        normalized.push({
          senderPhone,
          messageType,
          textBody,
          providerMessageId,
          rawPayload: message,
        });
      }
    }
  }

  return normalized;
};
