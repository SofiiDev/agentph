import { beforeEach, describe, expect, it, vi } from 'vitest';

const setEnv = () => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'anon';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
  process.env.OPENAI_API_KEY = 'sk-1';
  process.env.JWT_SECRET = 'super-secret-123';
  process.env.RATE_LIMIT_MAX_REQUESTS = '5';
  process.env.RATE_LIMIT_WINDOW_MS = '60000';
  process.env.MAX_UPLOAD_BYTES = '100000';
  process.env.CHUNK_SIZE_WORDS = '5';
  process.env.CHUNK_OVERLAP_WORDS = '1';
};

const createSupabaseMock = () => ({
  uploadPrivateObject: vi.fn(async () => ({})),
  select: vi.fn(async () => []),
  insert: vi.fn(async ({ table }: { table: string }) => {
    if (table === 'regulatory_documents') return [{ id: 'doc-1' }];
    if (table === 'document_versions') return [{ id: 'ver-1' }];
    if (table === 'document_ingestion_jobs') return [{ id: 'job-1' }];
    if (table === 'document_chunks') return [{ id: 'chunk-1' }];
    return [{}];
  }),
  patch: vi.fn(async () => [{}])
});

describe('ingestion service', () => {
  beforeEach(() => {
    vi.resetModules();
    setEnv();
  });

  it('sube archivo válido y crea registros documentales', async () => {
    const supabaseMock = createSupabaseMock();
    vi.doMock('../supabase-admin', () => ({ getSupabaseAdminClient: () => supabaseMock }));

    const { createUpload } = await import('../service');

    const result = await createUpload('org-1', 'user-1', {
      fileName: 'test.txt',
      mimeType: 'text/plain',
      fileBase64: Buffer.from('hola mundo regulatorio').toString('base64')
    });

    expect(result.deduplicated).toBe(false);
    expect(supabaseMock.uploadPrivateObject).toHaveBeenCalledTimes(1);
    expect(supabaseMock.insert).toHaveBeenCalled();
  });

  it('error de parsing marca job y documento como failed', async () => {
    const supabaseMock = createSupabaseMock();
    supabaseMock.select = vi.fn(async () => [
      {
        id: 'job-1',
        organization_id: 'org-1',
        document_version_id: 'ver-1',
        created_by: 'user-1',
        status: 'uploading',
        attempt_count: 0,
        metadata: { mime_type: 'application/pdf', file_base64: '' }
      }
    ]);

    vi.doMock('../supabase-admin', () => ({ getSupabaseAdminClient: () => supabaseMock }));

    const { processIngestionJob } = await import('../service');

    await expect(processIngestionJob('job-1')).rejects.toBeDefined();
    const payloads = supabaseMock.patch.mock.calls.map((call) => call[2]);
    expect(payloads.some((p: { status?: string }) => p.status === 'failed')).toBe(true);
    expect(payloads.some((p: { processing_status?: string }) => p.processing_status === 'failed')).toBe(true);
  });
});
