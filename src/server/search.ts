import { AppError } from './errors';
import { createEmbedding } from './embeddings';
import { getSupabaseAdminClient } from './supabase-admin';

export type SearchFilters = {
  organizationId: string;
  documentType?: string;
  onlyApproved?: boolean;
  currentOnly?: boolean;
  includeObsolete?: boolean;
  tags?: string[];
  topK?: number;
};

export type SearchResult = {
  chunk_id: string;
  score: number;
  content: string;
  document_id: string;
  document_name: string;
  document_version: string;
  page_number: number | null;
  section_ref: string | null;
  status: 'draft' | 'in_review' | 'approved' | 'obsolete';
};

export const normalizeTopK = (value?: number) => {
  const topK = value ?? 8;
  return Math.max(1, Math.min(topK, 50));
};

export const searchRelevantChunks = async (query: string, filters: SearchFilters): Promise<SearchResult[]> => {
  if (!query.trim()) {
    throw new AppError('INVALID_QUERY', 'La búsqueda no puede estar vacía', 400);
  }

  const supabase = getSupabaseAdminClient();
  const embedding = await createEmbedding(query);

  const rows = await supabase.rpc('search_relevant_chunks', {
    query_text: query,
    query_embedding: `[${embedding.join(',')}]`,
    org_id: filters.organizationId,
    top_k: normalizeTopK(filters.topK),
    only_approved: filters.onlyApproved ?? false,
    doc_type_filter: filters.documentType ?? null,
    tags_filter: filters.tags?.length ? filters.tags : null,
    current_only: filters.currentOnly ?? true,
    include_obsolete: filters.includeObsolete ?? false
  });

  return rows as SearchResult[];
};
