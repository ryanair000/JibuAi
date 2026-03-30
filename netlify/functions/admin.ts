import {
  authorizeAdminRequest,
  getAdminResourceData,
  isAdminResource,
  updateAdminConversationStatus,
} from '../../src/services/adminService';
import { getHeaderValue } from '../../src/utils/http';
import { getQueryValue } from '../../src/utils/http';

type NetlifyFunctionEvent = {
  httpMethod: string;
  body?: string | null;
  headers?: Record<string, string | undefined> | null;
  path?: string;
  queryStringParameters?: Record<string, string | undefined> | null;
  rawUrl?: string;
};

const jsonResponse = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});

const getResourceFromPath = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  const pathname = value.split('?')[0];
  const segments = pathname.split('/').filter(Boolean);
  const adminIndex = segments.lastIndexOf('admin');

  if (adminIndex === -1 || adminIndex === segments.length - 1) {
    return undefined;
  }

  return segments[adminIndex + 1];
};

export const config = {
  path: ['/admin/conversations', '/admin/messages', '/admin/webhook-events'],
};

export const handler = async (event: NetlifyFunctionEvent) => {
  const method = event.httpMethod.toUpperCase();
  const authorization = authorizeAdminRequest(event.headers ?? {});

  if (!authorization.authorized) {
    if (authorization.reason === 'not_configured') {
      return jsonResponse(503, { error: 'Admin API token is not configured' });
    }

    if (authorization.reason === 'missing_token') {
      return jsonResponse(401, { error: 'Admin API token is required' });
    }

    return jsonResponse(403, { error: 'Invalid admin API token' });
  }

  const query = event.queryStringParameters ?? {};
  const resource =
    getQueryValue(query, 'resource') ??
    getResourceFromPath(event.path) ??
    getResourceFromPath(event.rawUrl ? new URL(event.rawUrl).pathname : undefined) ??
    getResourceFromPath(getHeaderValue(event.headers ?? {}, 'x-forwarded-uri')) ??
    getResourceFromPath(getHeaderValue(event.headers ?? {}, 'x-original-uri'));

  if (!isAdminResource(resource)) {
    return jsonResponse(404, { error: 'Admin resource not found' });
  }

  if (method === 'GET') {
    const result = await getAdminResourceData(resource, query);
    return jsonResponse(200, result);
  }

  if (method === 'PATCH' && resource === 'conversations') {
    let body: Record<string, unknown> = {};

    if (event.body) {
      try {
        const parsed = JSON.parse(event.body);
        body =
          typeof parsed === 'object' && parsed !== null
            ? (parsed as Record<string, unknown>)
            : {};
      } catch {
        return jsonResponse(400, { error: 'Invalid JSON payload' });
      }
    }

    const result = await updateAdminConversationStatus({
      conversationId:
        typeof body.conversationId === 'string' ? body.conversationId : undefined,
      status: typeof body.status === 'string' ? body.status : undefined,
    });

    if (!result.ok) {
      if (result.reason === 'conversation_not_found') {
        return jsonResponse(404, { error: 'Conversation not found' });
      }

      if (result.reason === 'missing_conversation_id') {
        return jsonResponse(400, { error: 'conversationId is required' });
      }

      if (result.reason === 'missing_status') {
        return jsonResponse(400, { error: 'status is required' });
      }

      return jsonResponse(400, {
        error: 'Invalid status. Allowed values: open, needs_human, resolved',
      });
    }

    return jsonResponse(200, {
      updated: true,
      conversation: result.data,
    });
  }

  return jsonResponse(405, { error: 'Method not allowed' });
};
