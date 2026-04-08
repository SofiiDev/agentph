import { describe, expect, it } from 'vitest';
import { rankChunks, toRetrievedContext, type RetrievedChunk } from '@/domain/retrieval';

const chunks: RetrievedChunk[] = [
  {
    chunk_id: '1',
    document_id: 'DOC-A',
    document_version: '2.0',
    section: '4.2',
    page_or_chunk: 'p.12',
    status: 'vigente',
    content: 'Contenido A',
    similarity: 0.7
  },
  {
    chunk_id: '2',
    document_id: 'DOC-B',
    document_version: '1.0',
    section: '1.1',
    page_or_chunk: 'chunk-3',
    status: 'borrador',
    content: 'Contenido B',
    similarity: 0.85
  }
];

describe('retrieval ranking', () => {
  it('prioriza vigentes/aprobados sobre borrador con score ponderado', () => {
    const ranked = rankChunks(chunks);
    expect(ranked[0].document_id).toBe('DOC-A');
  });

  it('serializa contexto con metadatos obligatorios', () => {
    const context = toRetrievedContext(chunks);
    expect(context).toContain('doc:DOC-A');
    expect(context).toContain('version:2.0');
    expect(context).toContain('section:4.2');
    expect(context).toContain('page_or_chunk:p.12');
  });
});
