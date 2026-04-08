import { createHmac } from 'node:crypto';

export const createTestJwt = (sub: string, orgId: string, secret = 'super-secret-123') => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({ sub, org_id: orgId, exp: Math.floor(Date.now() / 1000) + 3600 })
  ).toString('base64url');

  const signingInput = `${header}.${payload}`;
  const signature = createHmac('sha256', secret).update(signingInput).digest('base64url');

  return `${signingInput}.${signature}`;
};
