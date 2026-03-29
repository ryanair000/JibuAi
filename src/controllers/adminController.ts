import type { Request, Response } from 'express';

import { authorizeAdminRequest, getAdminResourceData, isAdminResource } from '../services/adminService';

const sendAuthFailure = (
  res: Response,
  reason: 'not_configured' | 'missing_token' | 'invalid_token' | undefined,
): Response => {
  if (reason === 'not_configured') {
    return res.status(503).json({ error: 'Admin API token is not configured' });
  }

  if (reason === 'missing_token') {
    return res.status(401).json({ error: 'Admin API token is required' });
  }

  return res.status(403).json({ error: 'Invalid admin API token' });
};

export const getAdminResource = async (req: Request, res: Response): Promise<Response> => {
  const authorization = authorizeAdminRequest(req.headers);

  if (!authorization.authorized) {
    return sendAuthFailure(res, authorization.reason);
  }

  const resource = Array.isArray(req.params.resource)
    ? req.params.resource[0]
    : req.params.resource;

  if (!isAdminResource(resource)) {
    return res.status(404).json({ error: 'Admin resource not found' });
  }

  const result = await getAdminResourceData(
    resource,
    req.query as Record<string, string | string[] | undefined>,
  );

  return res.status(200).json(result);
};
