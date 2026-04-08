export type RetrievedChunk = {
  chunk_id: string;
  document_id: string;
  document_version: string;
  section: string;
  page_or_chunk: string;
  status: 'vigente' | 'aprobado' | 'borrador' | 'obsoleto';
  content: string;
  similarity: number;
};

const STATUS_WEIGHT: Record<RetrievedChunk['status'], number> = {
  vigente: 1,
  aprobado: 0.9,
  borrador: 0.5,
  obsoleto: 0.1
};

export const rankChunks = (chunks: RetrievedChunk[]): RetrievedChunk[] => {
  return [...chunks].sort((a, b) => {
    const scoreA = a.similarity * STATUS_WEIGHT[a.status];
    const scoreB = b.similarity * STATUS_WEIGHT[b.status];
    return scoreB - scoreA;
  });
};

export const toRetrievedContext = (chunks: RetrievedChunk[]): string => {
  return rankChunks(chunks)
    .map(
      (chunk) =>
        `[doc:${chunk.document_id} version:${chunk.document_version} section:${chunk.section} page_or_chunk:${chunk.page_or_chunk} status:${chunk.status}]\n${chunk.content}`
    )
    .join('\n\n');
};
