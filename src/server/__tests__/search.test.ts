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

describe('searchRelevantChunks', () => {
  beforeEach(() => {
    vi.resetModules();
    setEnv();
  });

  it('la búsqueda usa tenant correcto y excluye obsoletos por defecto', async () => {
    const rpcMock = vi.fn(async () => []);

    vi.doMock('../embeddings', () => ({ createEmbedding: async () => [0.1, 0.2] }));
    vi.doMock('../supabase-admin', () => ({ getSupabaseAdminClient: () => ({ rpc: rpcMock }) }));

    const { searchRelevantChunks } = await import('../search');
    await searchRelevantChunks('stability', { organizationId: 'org-a' });

    const params = rpcMock.mock.calls[0][1] as Record<string, unknown>;
    expect(params.org_id).toBe('org-a');
    expect(params.include_obsolete).toBe(false);
  });

  it('filtro por tipo de documento funciona', async () => {
    const rpcMock = vi.fn(async () => []);
    vi.doMock('../embeddings', () => ({ createEmbedding: async () => [0.1, 0.2] }));
    vi.doMock('../supabase-admin', () => ({ getSupabaseAdminClient: () => ({ rpc: rpcMock }) }));

    const { searchRelevantChunks } = await import('../search');
    await searchRelevantChunks('stability', { organizationId: 'org-a', documentType: 'sop' });

    const params = rpcMock.mock.calls[0][1] as Record<string, unknown>;
    expect(params.doc_type_filter).toBe('sop');
  });

  it('top_k respeta límites', async () => {
    const rpcMock = vi.fn(async () => []);
    vi.doMock('../embeddings', () => ({ createEmbedding: async () => [0.1, 0.2] }));
    vi.doMock('../supabase-admin', () => ({ getSupabaseAdminClient: () => ({ rpc: rpcMock }) }));

    const { searchRelevantChunks } = await import('../search');
    await searchRelevantChunks('stability', { organizationId: 'org-a', topK: 999 });

    const params = rpcMock.mock.calls[0][1] as Record<string, unknown>;
    expect(params.top_k).toBe(50);
  });

  it('búsqueda vacía falla con error claro', async () => {
    vi.doMock('../embeddings', () => ({ createEmbedding: async () => [0.1, 0.2] }));
    vi.doMock('../supabase-admin', () => ({ getSupabaseAdminClient: () => ({ rpc: vi.fn() }) }));

    const { searchRelevantChunks } = await import('../search');
    await expect(searchRelevantChunks('   ', { organizationId: 'org-a' })).rejects.toThrow(/no puede estar vacía/);
  });
});
