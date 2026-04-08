import { randomUUID } from 'node:crypto';
import { AppError } from './errors';
import { jsonError } from './json-response';
import { log } from './logger';

export type ApiEvent = {
  httpMethod: string;
  path?: string;
  headers?: Record<string, string | undefined>;
  body: string | null;
};

export type ApiHandler = (event: ApiEvent, requestId: string) => Promise<{
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}>;

export const withApiHandler = (handler: ApiHandler) => {
  return async (event: ApiEvent) => {
    const requestId = randomUUID();

    try {
      const result = await handler(event, requestId);
      log('info', 'api_request_ok', {
        requestId,
        path: event.path,
        method: event.httpMethod,
        statusCode: result.statusCode
      });
      return result;
    } catch (error) {
      if (error instanceof AppError) {
        log('warn', 'api_request_handled_error', {
          requestId,
          path: event.path,
          method: event.httpMethod,
          code: error.code,
          statusCode: error.statusCode
        });
        return jsonError(requestId, error.statusCode, error.code, error.message, error.details);
      }

      log('error', 'api_request_unhandled_error', {
        requestId,
        path: event.path,
        method: event.httpMethod,
        error: error instanceof Error ? error.message : String(error)
      });
      return jsonError(requestId, 500, 'INTERNAL_ERROR', 'Error interno del servidor');
    }
  };
};
