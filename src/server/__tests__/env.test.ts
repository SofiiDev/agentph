import { describe, expect, it, vi } from 'vitest';

describe('server env validation', () => {
  it('lanza error cuando faltan env vars', async () => {
    vi.resetModules();
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.JWT_SECRET;
    delete process.env.RATE_LIMIT_MAX_REQUESTS;
    delete process.env.RATE_LIMIT_WINDOW_MS;

    const envModule = await import('@/server/env');

    expect(() => envModule.assertEnvLoaded()).toThrow(/Invalid server env/);
  });
});
