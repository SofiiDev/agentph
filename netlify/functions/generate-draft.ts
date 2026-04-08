import { getServiceSupabase } from '@/lib/supabase';
import { queryInputSchema } from '@/domain/schemas';
import { askDraftModel, embedText } from '@/lib/openai';
import { toRetrievedContext, type RetrievedChunk } from '@/domain/retrieval';

export const handler = async (event: { httpMethod: string; body: string | null }) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const parsed = queryInputSchema.safeParse(JSON.parse(event.body ?? '{}'));
  if (!parsed.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: parsed.error.flatten() })
    };
  }

  const supabase = getServiceSupabase();
  const tenantId = parsed.data.tenantId;

  const queryEmbedding = await embedText(parsed.data.query);

  const { data: chunks, error } = await supabase.rpc('match_document_chunks', {
    query_embedding: `[${queryEmbedding.join(',')}]`,
    tenant_id_param: tenantId,
    match_count: 20
  });

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }

  const typedChunks = (chunks ?? []) as RetrievedChunk[];

  const modelResponse =
    typedChunks.length === 0
      ? {
          status: 'insufficient_evidence',
          title: 'Sin evidencia suficiente',
          draft: 'No tengo evidencia suficiente en los documentos provistos',
          citations: []
        }
      : await askDraftModel(parsed.data.query, toRetrievedContext(typedChunks));

  await supabase.from('audit_logs').insert({
    tenant_id: tenantId,
    user_id: null,
    action_type: 'draft_generation',
    prompt: parsed.data.query,
    used_documents: typedChunks.map((chunk) => ({
      document_id: chunk.document_id,
      version: chunk.document_version
    })),
    used_chunks: typedChunks.map((chunk) => chunk.chunk_id),
    response_payload: modelResponse,
    review_status: 'pending'
  });

  return {
    statusCode: 200,
    body: JSON.stringify(modelResponse)
  };
};
