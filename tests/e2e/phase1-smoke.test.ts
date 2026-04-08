import { beforeEach, describe, expect, it, vi } from 'vitest';

const setValidEnv = () => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'anon';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
  process.env.OPENAI_API_KEY = 'sk-1';
  process.env.JWT_SECRET = 'super-secret-123';
  process.env.RATE_LIMIT_MAX_REQUESTS = '5';
  process.env.RATE_LIMIT_WINDOW_MS = '60000';
};

describe('phase1 e2e smoke', () => {
  beforeEach(() => {
    vi.resetModules();
    setValidEnv();
  });

  it('health + auth-check con token válido', async () => {
    const health = await import('../../netlify/functions/api-health');
    const authCheck = await import('../../netlify/functions/api-auth-check');

    const healthResponse = await health.handler({ httpMethod: 'GET', body: null, headers: {}, path: '/api/health' });
    expect(healthResponse.statusCode).toBe(200);

    const authResponse = await authCheck.handler({
      httpMethod: 'GET',
      body: null,
      path: '/api/auth-check',
      headers: { authorization: 'Bearer user-1:tenant-1', 'x-forwarded-for': '127.0.0.1' }
    });
    expect(authResponse.statusCode).toBe(200);
  });
});
