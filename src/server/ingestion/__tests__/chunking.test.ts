import { describe, expect, it, vi } from 'vitest';

const setEnv = () => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'anon';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
  process.env.OPENAI_API_KEY = 'sk-1';
  process.env.JWT_SECRET = 'super-secret-123';
  process.env.RATE_LIMIT_MAX_REQUESTS = '5';
  process.env.RATE_LIMIT_WINDOW_MS = '60000';
  process.env.MAX_UPLOAD_BYTES = '100000';
  process.env.CHUNK_SIZE_WORDS = '4';
  process.env.CHUNK_OVERLAP_WORDS = '1';
};

describe('chunking', () => {
  it('genera chunks ordenados', async () => {
    vi.resetModules();
    setEnv();

    const { buildChunks } = await import('../chunking');
    const chunks = buildChunks([{ pageNumber: 1, text: 'uno dos tres cuatro cinco seis siete ocho nueve' }]);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].chunkIndex).toBe(0);
    expect(chunks[1].chunkIndex).toBe(1);
    expect(chunks[0].pageNumber).toBe(1);
  });
});
