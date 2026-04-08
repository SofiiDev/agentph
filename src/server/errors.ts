export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
    public readonly details?: unknown
  ) {
    super(message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autenticado') {
    super('UNAUTHORIZED', message, 401);
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super('RATE_LIMITED', 'Demasiadas solicitudes, intenta más tarde', 429);
  }
}

export class MethodNotAllowedError extends AppError {
  constructor() {
    super('METHOD_NOT_ALLOWED', 'Método no permitido', 405);
  }
}
