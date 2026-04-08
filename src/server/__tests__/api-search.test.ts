import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestJwt } from './helpers';

const setEnv = () => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'anon';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
  process.env.OPENAI_API_KEY = 'sk-1';
  process.env.JWT_SECRET = 'super-secret-123';
  process.env.RATE_LIMIT_MAX_REQUESTS = '5';
  process.env.RATE_LIMIT_WINDOW_MS = '60000';
  process.env.MAX_UPLOAD_BYTES = '100000';
  process.env.CHUNK_SIZE_WORDS = '10';
  process.env.CHUNK_OVERLAP_WORDS = '2';
};

describe('api search endpoint', () => {
  beforeEach(() => {
    vi.resetModules();
    setEnv();
  });

  it('devuelve shape esperado', async () => {
    vi.doMock('../search', () => ({
      searchRelevantChunks: async () => [
        {
          chunk_id: 'c1',
          score: 0.91,
          content: 'abc',
          document_id: 'd1',
          document_name: 'Doc',
          document_version: 'v1',
          page_number: 1,
          section_ref: '1.1',
          status: 'approved'
        }
      ]
    }));

    const { handler } = await import('../../../netlify/functions/api-search');
    const response = await handler({
      httpMethod: 'POST',
      path: '/api/search',
      headers: { authorization: `Bearer ${createTestJwt('user-1', 'org-a')}` },
      body: JSON.stringify({ query: 'stability' })
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.data.results[0].chunk_id).toBe('c1');
  });
});
