import { listRecentConversations, listRecentMessages } from '../repositories/adminRepo';
import { listRecentWebhookEvents } from '../repositories/webhookEventRepo';
import { getHeaderValue, getQueryValue, parseLimit } from '../utils/http';
import { verifyAdminToken } from './webhookSecurityService';

type AdminQuery = Record<string, string | string[] | undefined>;
type AdminHeaders = Record<string, string | string[] | undefined>;

export type AdminResource = 'conversations' | 'messages' | 'webhook-events';

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

export const getAdminResourceData = async (resource: AdminResource, query: AdminQuery) => {
  const limit = parseLimit(getQueryValue(query, 'limit'));

  switch (resource) {
    case 'conversations': {
      const conversations = await listRecentConversations(limit);
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
