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
  process.env.LLM_PROVIDER = 'openai';
  process.env.MAX_UPLOAD_BYTES = '100000';
  process.env.CHUNK_SIZE_WORDS = '10';
  process.env.CHUNK_OVERLAP_WORDS = '2';
};

describe('api ask endpoint', () => {
  beforeEach(() => {
    vi.resetModules();
    setEnv();
  });

  it('endpoint requiere auth', async () => {
    const { handler } = await import('../../../netlify/functions/api-ask');
    const res = await handler({ httpMethod: 'POST', path: '/api/ask', headers: {}, body: JSON.stringify({ question: 'x' }) });
    expect(res.statusCode).toBe(401);
  });

  it('no devuelve citas de otros tenants (citas validadas sobre retrieved_context)', async () => {
    vi.doMock('../ask', () => ({
      askRegulatoryQuestion: async () => ({
        answer: 'ok',
        citations: [
          {
            document_id: 'doc-tenant-a',
            document_name: 'Doc A',
            version: 'v1',
            page_number: 1,
            section_ref: '1.1',
            chunk_id: 'chunk-a',
            support_level: 'direct'
          }
        ],
        unsupported_claims: [],
        confidence: 'high',
        needs_human_review: false
      })
    }));

    const { handler } = await import('../../../netlify/functions/api-ask');
    const res = await handler({
      httpMethod: 'POST',
      path: '/api/ask',
      headers: { authorization: `Bearer ${createTestJwt('user-1', 'org-a')}` },
      body: JSON.stringify({ question: 'x' })
    });

    const body = JSON.parse(res.body);
    expect(body.data.citations[0].document_id).toBe('doc-tenant-a');
  });
});
