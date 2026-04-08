import { getServiceSupabase } from '@/lib/supabase';

export const handler = async (event: { httpMethod: string; body: string | null }) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const body = JSON.parse(event.body ?? '{}') as {
    document_id: string;
    tenant_id: string;
    chunks: Array<{ section: string; page_or_chunk: string; content: string }>;
  };

  const supabase = getServiceSupabase();

  const rows = body.chunks.map((chunk, index) => ({
    tenant_id: body.tenant_id,
    document_id: body.document_id,
    chunk_order: index,
    section: chunk.section,
    page_or_chunk: chunk.page_or_chunk,
    content: chunk.content
  }));

  const { error } = await supabase.from('document_chunks').insert(rows);

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }

  return {
    statusCode: 202,
    body: JSON.stringify({ status: 'queued_and_persisted' })
  };
};
