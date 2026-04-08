import { describe, expect, it, vi } from 'vitest';

const setEnv = () => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'anon';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
  process.env.OPENAI_API_KEY = 'sk-1';
  process.env.JWT_SECRET = 'super-secret-123';
  process.env.RATE_LIMIT_MAX_REQUESTS = '5';
  process.env.RATE_LIMIT_WINDOW_MS = '60000';
  process.env.MAX_UPLOAD_BYTES = '100';
  process.env.CHUNK_SIZE_WORDS = '10';
  process.env.CHUNK_OVERLAP_WORDS = '2';
};

describe('upload validation', () => {
  it('rechaza tipos no permitidos', async () => {
    vi.resetModules();
    setEnv();
    const { validateUploadInput } = await import('../validation');

    expect(() =>
      validateUploadInput({
        fileName: 'a.exe',
        mimeType: 'application/octet-stream',
        fileBase64: Buffer.from('abc').toString('base64')
      })
    ).toThrow(/Tipo de archivo no permitido/);
  });
});
