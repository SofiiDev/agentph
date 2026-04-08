import { UnauthorizedError } from './errors';

export type AuthUser = {
  userId: string;
  tenantId: string;
  email?: string;
};

export const getBearerToken = (authorization?: string): string => {
  if (!authorization?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Falta token Bearer');
  }

  return authorization.replace('Bearer ', '').trim();
};

export const getAuthUserFromEvent = (event: { headers?: Record<string, string | undefined> }): AuthUser => {
  const token = getBearerToken(event.headers?.authorization ?? event.headers?.Authorization);

  // Placeholder de validación JWT (fase 1)
  // Formato esperado para pruebas: userId:tenantId
  const parts = token.split(':');
  if (parts.length < 2) {
    throw new UnauthorizedError('Token inválido');
  }

  return {
    userId: parts[0],
    tenantId: parts[1]
  };
};
