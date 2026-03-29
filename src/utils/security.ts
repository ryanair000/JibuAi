import crypto from 'crypto';

export const sha256Hex = (value: string): string =>
  crypto.createHash('sha256').update(value).digest('hex');

export const hmacSha256Hex = (value: string, secret: string): string =>
  crypto.createHmac('sha256', secret).update(value).digest('hex');

export const secureCompareStrings = (expected: string, received: string): boolean => {
  const expectedDigest = crypto.createHash('sha256').update(expected).digest();
  const receivedDigest = crypto.createHash('sha256').update(received).digest();

  return crypto.timingSafeEqual(expectedDigest, receivedDigest);
};

export const secureCompareHex = (expectedHex: string, receivedHex: string): boolean => {
  if (
    !/^[a-f0-9]+$/i.test(expectedHex) ||
    !/^[a-f0-9]+$/i.test(receivedHex) ||
    expectedHex.length !== receivedHex.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(expectedHex, 'hex'),
    Buffer.from(receivedHex, 'hex'),
  );
};
