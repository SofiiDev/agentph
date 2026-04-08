import { beforeEach, describe, expect, it, vi } from 'vitest';

const setEnv = () => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'anon';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
  process.env.OPENAI_API_KEY = 'sk-1';
  process.env.JWT_SECRET = 'super-secret-123';
  process.env.RATE_LIMIT_MAX_REQUESTS = '5';
  process.env.RATE_LIMIT_WINDOW_MS = '60000';
  process.env.LLM_PROVIDER = 'openai';
  process.env.MAX_UPLOAD_BYTES = '100000';
  process.env.CHUNK_SIZE_WORDS = '10';
  process.env.CHUNK_OVERLAP_WORDS = '2';
};

describe('api-documents-upload', () => {
  beforeEach(() => {
    vi.resetModules();
    setEnv();
  });

  it('usuario sin auth no puede subir', async () => {
    const { handler } = await import('../../../netlify/functions/api-documents-upload');
    const response = await handler({ httpMethod: 'POST', body: '{}', headers: {}, path: '/api/documents/upload' });
    expect(response.statusCode).toBe(401);
  });
});
