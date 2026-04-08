import { describe, expect, it, vi, beforeEach } from 'vitest';

const setValidEnv = () => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'anon';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
  process.env.OPENAI_API_KEY = 'sk-1';
  process.env.JWT_SECRET = 'super-secret-123';
  process.env.RATE_LIMIT_MAX_REQUESTS = '5';
  process.env.RATE_LIMIT_WINDOW_MS = '60000';
  process.env.LLM_PROVIDER = 'openai';
  process.env.MAX_UPLOAD_BYTES = '10485760';
  process.env.CHUNK_SIZE_WORDS = '220';
  process.env.CHUNK_OVERLAP_WORDS = '40';
};

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.resetModules();
    setValidEnv();
  });

  it('responde 200', async () => {
    const { handler } = await import('../../../netlify/functions/api-health');
    const response = await handler({ httpMethod: 'GET', body: null, headers: {}, path: '/api/health' });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe('ok');
  });
});
