import { createHmac } from 'node:crypto';
import { UnauthorizedError } from './errors';
import { getServerEnv } from './env';

export type AuthUser = {
  userId: string;
  tenantId: string;
  email?: string;
};

type JwtPayload = {
  sub: string;
  org_id: string;
  email?: string;
  exp?: number;
};

const base64UrlToString = (input: string) => {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64').toString('utf8');
};

const safeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let res = 0;
  for (let i = 0; i < a.length; i += 1) {
    res |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return res === 0;
};

const verifyHs256 = (token: string): JwtPayload => {
  const env = getServerEnv();
  const parts = token.split('.');
  if (parts.length !== 3) throw new UnauthorizedError('Token JWT inválido');

  const [headerB64, payloadB64, signatureB64] = parts;
  const header = JSON.parse(base64UrlToString(headerB64)) as { alg?: string; typ?: string };
  if (header.alg !== 'HS256') throw new UnauthorizedError('Algoritmo JWT no permitido');

  const signingInput = `${headerB64}.${payloadB64}`;
  const signature = createHmac('sha256', env.JWT_SECRET).update(signingInput).digest('base64url');
  if (!safeEqual(signature, signatureB64)) throw new UnauthorizedError('Firma JWT inválida');

  const payload = JSON.parse(base64UrlToString(payloadB64)) as JwtPayload;
  if (!payload.sub || !payload.org_id) throw new UnauthorizedError('JWT sin claims requeridos');
  if (payload.exp && Date.now() / 1000 > payload.exp) throw new UnauthorizedError('JWT expirado');

  return payload;
};

export const getBearerToken = (authorization?: string): string => {
  if (!authorization?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Falta token Bearer');
  }

  return authorization.replace('Bearer ', '').trim();
};

export const getAuthUserFromEvent = (event: { headers?: Record<string, string | undefined> }): AuthUser => {
  const token = getBearerToken(event.headers?.authorization ?? event.headers?.Authorization);
  const payload = verifyHs256(token);

  return {
    userId: payload.sub,
    tenantId: payload.org_id,
    email: payload.email
  };
};
