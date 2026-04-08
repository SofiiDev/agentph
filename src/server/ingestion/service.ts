import { getSupabaseAdminClient } from '../supabase-admin';
import { sha256 } from './checksum';
import { validateUploadInput } from './validation';
import { buildChunks } from './chunking';
import { parseDocumentByMime } from './parser';
import { log } from '../logger';
import { createEmbedding } from '../embeddings';
import type { UploadInput } from './types';

const BUCKET = 'regulatory-private-documents';

export const createUpload = async (organizationId: string, userId: string, input: UploadInput) => {
  const supabase = getSupabaseAdminClient();
  const bytes = validateUploadInput(input);
  const checksum = sha256(bytes);

  if (input.dedupeByChecksum) {
    const existing = await supabase.select('document_versions', {
      select: 'id,version,source_file_path,checksum,status,processing_status',
      organization_id: `eq.${organizationId}`,
      checksum: `eq.${checksum}`,
      limit: '1'
    });

    if (Array.isArray(existing) && existing.length > 0) {
      return { deduplicated: true, existing: existing[0] };
    }
  }

  const ext = input.fileName.split('.').pop() ?? 'bin';
  const safeName = input.fileName.replace(/[^a-zA-Z0-9_.-]/g, '_');
  const objectPath = `${organizationId}/${Date.now()}-${safeName}`;

  await supabase.uploadPrivateObject(BUCKET, objectPath, bytes, input.mimeType);

  const docRows = await supabase.insert({
    table: 'regulatory_documents',
    rows: {
      organization_id: organizationId,
      project_id: input.projectId ?? null,
      code: `DOC-${Date.now()}`,
      title: input.fileName,
      document_type: ext,
      default_status: 'draft',
      created_by: userId
    }
  });

  const doc = docRows[0];

  const versionRows = await supabase.insert({
    table: 'document_versions',
    rows: {
      organization_id: organizationId,
      regulatory_document_id: doc.id,
      version: 'v1.0',
      status: 'draft',
      is_current: true,
      effective_date: new Date().toISOString().slice(0, 10),
      source_file_path: objectPath,
      checksum,
      created_by: userId,
      mime_type: input.mimeType,
      file_size_bytes: bytes.byteLength,
      processing_status: 'uploading'
    }
  });

  const version = versionRows[0];

  const ingestionRows = await supabase.insert({
    table: 'document_ingestion_jobs',
    rows: {
      organization_id: organizationId,
      document_version_id: version.id,
      status: 'uploading',
      attempt_count: 0,
      metadata: {
        original_file_name: input.fileName,
        mime_type: input.mimeType,
        file_size_bytes: bytes.byteLength,
        checksum,
        file_base64: input.fileBase64
      },
      created_by: userId
    }
  });

  log('info', 'document_upload_created', {
    organizationId,
    documentVersionId: version.id,
    ingestionJobId: ingestionRows[0].id,
    checksum
  });

  return {
    deduplicated: false,
    document: doc,
    version,
    ingestionJob: ingestionRows[0]
  };
};

export const processIngestionJob = async (jobId: string) => {
  const supabase = getSupabaseAdminClient();

  const jobs = await supabase.select('document_ingestion_jobs', {
    select: '*',
    id: `eq.${jobId}`,
    limit: '1'
  });

  if (!Array.isArray(jobs) || jobs.length === 0) {
    throw new Error(`Ingestion job ${jobId} not found`);
  }

  const job = jobs[0];

  if (job.status === 'ready') {
    return { alreadyProcessed: true };
  }

  await supabase.patch('document_ingestion_jobs', { id: `eq.${jobId}` }, {
    status: 'processing',
    started_at: new Date().toISOString(),
    attempt_count: (job.attempt_count ?? 0) + 1
  });

  await supabase.patch('document_versions', { id: `eq.${job.document_version_id}` }, { processing_status: 'processing' });

  try {
    const bytes = Buffer.from(job.metadata.file_base64 ?? '', 'base64');
    const mimeType = job.metadata.mime_type as string;
    const parsed = parseDocumentByMime(mimeType, bytes);
    const chunks = buildChunks(parsed.pageMap);

    const chunkRows = chunks.map((chunk) => ({
      organization_id: job.organization_id,
      document_version_id: job.document_version_id,
      chunk_index: chunk.chunkIndex,
      page_number: chunk.pageNumber,
      section_ref: chunk.sectionRef,
      content: chunk.content,
      checksum: chunk.checksum,
      created_by: job.created_by
    }));

    if (chunkRows.length > 0) {
      const insertedChunks = await supabase.insert({ table: 'document_chunks', rows: chunkRows });

      const embeddingRows = [] as Array<{ organization_id: string; document_chunk_id: string; embedding: string; model: string }>;
      for (const insertedChunk of insertedChunks) {
        const vector = await createEmbedding(insertedChunk.content as string);
        embeddingRows.push({
          organization_id: job.organization_id,
          document_chunk_id: insertedChunk.id,
          embedding: `[${vector.join(',')}]`,
          model: 'text-embedding-3-small'
        });
      }

      if (embeddingRows.length > 0) {
        await supabase.insert({ table: 'document_embeddings', rows: embeddingRows });
      }
    }

    await supabase.patch('document_ingestion_jobs', { id: `eq.${jobId}` }, {
      status: 'ready',
      finished_at: new Date().toISOString(),
      last_error: null,
      chunk_count: chunks.length
    });

    await supabase.patch('document_versions', { id: `eq.${job.document_version_id}` }, { processing_status: 'ready' });

    log('info', 'document_ingestion_ready', {
      jobId,
      chunkCount: chunks.length,
      documentVersionId: job.document_version_id
    });

    return { alreadyProcessed: false, chunkCount: chunks.length };
  } catch (error) {
    await supabase.patch('document_ingestion_jobs', { id: `eq.${jobId}` }, {
      status: 'failed',
      finished_at: new Date().toISOString(),
      last_error: error instanceof Error ? error.message : String(error)
    });

    await supabase.patch('document_versions', { id: `eq.${job.document_version_id}` }, { processing_status: 'failed' });

    log('error', 'document_ingestion_failed', {
      jobId,
      error: error instanceof Error ? error.message : String(error)
    });

    throw error;
  }
};
