export type JsonSuccess<T> = {
  ok: true;
  data: T;
  requestId: string;
  timestamp: string;
};

export type JsonError = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId: string;
  timestamp: string;
};

export type JsonResponse<T> = JsonSuccess<T> | JsonError;
