import { env } from '../config/env';
import { hmacSha256Hex, secureCompareHex, secureCompareStrings, sha256Hex } from '../utils/security';

type SignatureVerificationResult =
  | {
      enforced: false;
      isValid: true;
      reason: 'app_secret_not_configured';
    }
  | {
      enforced: true;
      isValid: false;
      reason: 'signature_missing' | 'signature_malformed' | 'signature_mismatch';
    }
  | {
      enforced: true;
      isValid: true;
      reason: 'verified';
    };

export const computeWebhookPayloadHash = (rawBody: string): string => sha256Hex(rawBody);

export const verifyWebhookSignature = (
  rawBody: string,
  signatureHeader: string | undefined,
): SignatureVerificationResult => {
  if (!env.whatsappAppSecret) {
    return {
      enforced: false,
      isValid: true,
      reason: 'app_secret_not_configured',
    };
  }

  if (!signatureHeader) {
    return {
      enforced: true,
      isValid: false,
      reason: 'signature_missing',
    };
  }

  const [algorithm, providedSignature] = signatureHeader.split('=');

  if (algorithm !== 'sha256' || !providedSignature) {
    return {
      enforced: true,
      isValid: false,
      reason: 'signature_malformed',
    };
  }

  const expectedSignature = hmacSha256Hex(rawBody, env.whatsappAppSecret);

  if (!secureCompareHex(expectedSignature, providedSignature)) {
    return {
      enforced: true,
      isValid: false,
      reason: 'signature_mismatch',
    };
  }

  return {
    enforced: true,
    isValid: true,
    reason: 'verified',
  };
};

export const verifyAdminToken = (
  providedToken: string | undefined,
): { authorized: boolean; reason?: 'not_configured' | 'missing_token' | 'invalid_token' } => {
  if (!env.adminApiToken) {
    return {
      authorized: false,
      reason: 'not_configured',
    };
  }

  if (!providedToken) {
    return {
      authorized: false,
      reason: 'missing_token',
    };
  }

  if (!secureCompareStrings(env.adminApiToken, providedToken)) {
    return {
      authorized: false,
      reason: 'invalid_token',
    };
  }

  return {
    authorized: true,
  };
};
