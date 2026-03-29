import type { InputJsonValue } from '@prisma/client/runtime/library';

export const toJsonValue = (value: unknown): InputJsonValue => {
  if (value === undefined) {
    return {};
  }

  return JSON.parse(JSON.stringify(value)) as InputJsonValue;
};
