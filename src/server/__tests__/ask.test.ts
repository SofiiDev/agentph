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

describe('askRegulatoryQuestion', () => {
  beforeEach(() => {
    vi.resetModules();
    setEnv();
  });

  it('pregunta sin evidencia devuelve el rechazo exacto', async () => {
    const insertMock = vi.fn(async () => [{}]);
    vi.doMock('../search', () => ({ searchRelevantChunks: async () => [] }));
    vi.doMock('../supabase-admin', () => ({ getSupabaseAdminClient: () => ({ insert: insertMock }) }));

    const { askRegulatoryQuestion } = await import('../ask');
    const response = await askRegulatoryQuestion({ organizationId: 'org-a', userId: 'u1', question: 'X' });

    expect(response.answer).toBe('No tengo evidencia suficiente en los documentos provistos.');
  });

  it('respuesta con evidencia contiene citas válidas y unsupported_claims cuando corresponde', async () => {
    vi.doMock('../search', () => ({
      searchRelevantChunks: async () => [
        {
          chunk_id: 'chunk-1',
          score: 0.9,
          content: 'texto',
          document_id: 'doc-1',
          document_name: 'Doc 1',
          document_version: 'v1',
          page_number: 1,
          section_ref: '1.1',
          status: 'approved'
        }
      ]
    }));

    vi.doMock('../supabase-admin', () => ({ getSupabaseAdminClient: () => ({ insert: vi.fn(async () => [{}]) }) }));

    global.fetch = vi.fn(async () =>
      ({
        ok: true,
        json: async () => ({
          output: [
            {
              content: [
                {
                  text: JSON.stringify({
                    answer: 'Respuesta soportada',
                    citations: [
                      {
                        document_id: 'doc-1',
                        document_name: 'Doc 1',
                        version: 'v1',
                        page_number: 1,
                        section_ref: '1.1',
                        chunk_id: 'chunk-1',
                        support_level: 'direct'
                      }
                    ],
                    unsupported_claims: ['Punto no verificable'],
                    confidence: 'medium',
                    needs_human_review: true
                  })
                }
              ]
            }
          ]
        })
      }) as Response
    ) as typeof fetch;

    const { askRegulatoryQuestion } = await import('../ask');
    const response = await askRegulatoryQuestion({ organizationId: 'org-a', userId: 'u1', question: 'X' });

    expect(response.citations[0].chunk_id).toBe('chunk-1');
    expect(response.unsupported_claims.length).toBeGreaterThan(0);
  });



  it('rechaza citas fuera del tenant/retrieved_context', async () => {
    vi.doMock('../search', () => ({
      searchRelevantChunks: async () => [
        {
          chunk_id: 'chunk-1',
          score: 0.9,
          content: 'texto',
          document_id: 'doc-1',
          document_name: 'Doc 1',
          document_version: 'v1',
          page_number: 1,
          section_ref: '1.1',
          status: 'approved'
        }
      ]
    }));
    vi.doMock('../supabase-admin', () => ({ getSupabaseAdminClient: () => ({ insert: vi.fn(async () => [{}]) }) }));

    global.fetch = vi.fn(async () =>
      ({
        ok: true,
        json: async () => ({
          output: [
            {
              content: [
                {
                  text: JSON.stringify({
                    answer: 'Respuesta',
                    citations: [
                      {
                        document_id: 'doc-other',
                        document_name: 'Doc Other',
                        version: 'v9',
                        page_number: 1,
                        section_ref: '9.9',
                        chunk_id: 'chunk-other-tenant',
                        support_level: 'direct'
                      }
                    ],
                    unsupported_claims: [],
                    confidence: 'low',
                    needs_human_review: true
                  })
                }
              ]
            }
          ]
        })
      }) as Response
    ) as typeof fetch;

    const { askRegulatoryQuestion } = await import('../ask');
    await expect(askRegulatoryQuestion({ organizationId: 'org-a', userId: 'u1', question: 'X' })).rejects.toThrow(/fuera del contexto recuperado/);
  });

  it('si el modelo devuelve JSON inválido, rechaza y loguea error', async () => {
    const insertMock = vi.fn(async () => [{}]);
    vi.doMock('../search', () => ({
      searchRelevantChunks: async () => [
        {
          chunk_id: 'chunk-1',
          score: 0.9,
          content: 'texto',
          document_id: 'doc-1',
          document_name: 'Doc 1',
          document_version: 'v1',
          page_number: 1,
          section_ref: '1.1',
          status: 'approved'
        }
      ]
    }));
    vi.doMock('../supabase-admin', () => ({ getSupabaseAdminClient: () => ({ insert: insertMock }) }));

    global.fetch = vi.fn(async () =>
      ({
        ok: true,
        json: async () => ({ output: [{ content: [{ text: '{bad_json' }] }] })
      }) as Response
    ) as typeof fetch;

    const { askRegulatoryQuestion } = await import('../ask');
    await expect(askRegulatoryQuestion({ organizationId: 'org-a', userId: 'u1', question: 'X' })).rejects.toThrow(/JSON inválido/);
    expect(insertMock).toHaveBeenCalled();
  });
});
