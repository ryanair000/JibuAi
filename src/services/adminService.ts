import { listRecentConversations, listRecentMessages } from '../repositories/adminRepo';
import { listRecentWebhookEvents } from '../repositories/webhookEventRepo';
import { updateConversationStatus } from '../repositories/conversationRepo';
import { getHeaderValue, getQueryValue, parseLimit } from '../utils/http';
import { verifyAdminToken } from './webhookSecurityService';

type AdminQuery = Record<string, string | string[] | undefined>;
type AdminHeaders = Record<string, string | string[] | undefined>;

export type AdminResource = 'conversations' | 'messages' | 'webhook-events';
export type AdminConversationStatus = 'open' | 'needs_human' | 'resolved';

type UpdateConversationStatusInput = {
  conversationId?: string;
  status?: string;
};

type UpdateConversationStatusResult =
  | {
      ok: true;
      data: {
        id: string;
        status: string;
        updatedAt: Date;
      };
    }
  | {
      ok: false;
      reason:
        | 'conversation_not_found'
        | 'invalid_status'
        | 'missing_conversation_id'
        | 'missing_status';
    };

const adminConversationStatuses = ['open', 'needs_human', 'resolved'] as const;

const getAdminTokenFromHeaders = (headers: AdminHeaders): string | undefined => {
  const bearerToken = getHeaderValue(headers, 'authorization');

  if (bearerToken?.startsWith('Bearer ')) {
    return bearerToken.slice('Bearer '.length).trim();
  }

  return getHeaderValue(headers, 'x-admin-token');
};

export const authorizeAdminRequest = (headers: AdminHeaders) => {
  return verifyAdminToken(getAdminTokenFromHeaders(headers));
};

export const isAdminResource = (resource: string | undefined): resource is AdminResource =>
  resource === 'conversations' || resource === 'messages' || resource === 'webhook-events';

export const isAdminConversationStatus = (
  value: string | undefined,
): value is AdminConversationStatus =>
  typeof value === 'string' &&
  (adminConversationStatuses as readonly string[]).includes(value);

export const getAdminResourceData = async (resource: AdminResource, query: AdminQuery) => {
  const limit = parseLimit(getQueryValue(query, 'limit'));

  switch (resource) {
    case 'conversations': {
      const conversations = await listRecentConversations(
        limit,
        getQueryValue(query, 'status'),
      );
      return {
        resource,
        count: conversations.length,
        data: conversations,
      };
    }
    case 'messages': {
      const messages = await listRecentMessages(limit, getQueryValue(query, 'conversationId'));
      return {
        resource,
        count: messages.length,
        data: messages,
      };
    }
    case 'webhook-events': {
      const webhookEvents = await listRecentWebhookEvents(limit);
      return {
        resource,
        count: webhookEvents.length,
        data: webhookEvents,
      };
    }
  }
};

export const updateAdminConversationStatus = async (
  input: UpdateConversationStatusInput,
): Promise<UpdateConversationStatusResult> => {
  if (!input.conversationId) {
    return {
      ok: false,
      reason: 'missing_conversation_id',
    };
  }

  if (!input.status) {
    return {
      ok: false,
      reason: 'missing_status',
    };
  }

  if (!isAdminConversationStatus(input.status)) {
    return {
      ok: false,
      reason: 'invalid_status',
    };
  }

  try {
    const conversation = await updateConversationStatus(input.conversationId, input.status);
    return {
      ok: true,
      data: {
        id: conversation.id,
        status: conversation.status,
        updatedAt: conversation.updatedAt,
      },
    };
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2025'
    ) {
      return {
        ok: false,
        reason: 'conversation_not_found',
      };
    }

    throw error;
  }
};
