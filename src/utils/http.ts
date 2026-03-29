type HeaderValue = string | string[] | undefined;
type QueryValue = string | string[] | undefined;

export const getHeaderValue = (
  headers: Record<string, HeaderValue>,
  name: string,
): string | undefined => {
  const match = Object.entries(headers).find(
    ([headerName]) => headerName.toLowerCase() === name.toLowerCase(),
  );

  if (!match) {
    return undefined;
  }

  const value = match[1];
  return Array.isArray(value) ? value[0] : value;
};

export const getQueryValue = (
  query: Record<string, QueryValue>,
  name: string,
): string | undefined => {
  const value = query[name];
  return Array.isArray(value) ? value[0] : value;
};

export const parseLimit = (
  value: string | undefined,
  fallback = 20,
  maximum = 100,
): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, maximum);
};
