import type { JsonError, JsonSuccess } from '../types/api';

const now = () => new Date().toISOString();

export const jsonOk = <T>(requestId: string, data: T, statusCode = 200) => {
  const body: JsonSuccess<T> = {
    ok: true,
    data,
    requestId,
    timestamp: now()
  };

  return {
    statusCode,
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json'
    }
  };
};

export const jsonError = (requestId: string, statusCode: number, code: string, message: string, details?: unknown) => {
  const body: JsonError = {
    ok: false,
    error: { code, message, details },
    requestId,
    timestamp: now()
  };

  return {
    statusCode,
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json'
    }
  };
};
